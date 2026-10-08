import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { SkillInfo } from '@shared/types'

/**
 * Skills são arquivos .md numa pasta `skills/` do projeto. Cada arquivo vira uma
 * opção no seletor do app; o conteúdo é entregue à CLI de IA como contexto inicial.
 *
 * Frontmatter é opcional:
 *   ---
 *   name: Code Review
 *   description: Revisa o diff atual em busca de bugs
 *   ---
 */

function candidateDirs(): string[] {
  const dirs = [
    process.env.AGENT_ORCHESTRATOR_SKILLS_DIR,
    path.join(process.cwd(), 'skills'),
    path.join(app.getAppPath(), 'skills'),
    path.join(path.dirname(app.getPath('exe')), 'skills')
  ]
  return dirs.filter((d): d is string => !!d)
}

export function resolveSkillsDir(): string | null {
  for (const dir of candidateDirs()) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir
    } catch {
      // diretório inacessível, tenta o próximo
    }
  }
  return null
}

interface ParsedSkill {
  name?: string
  description?: string
  body: string
}

function parseFrontmatter(raw: string): ParsedSkill {
  const match = raw.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { body: raw.trim() }

  const [, block, body] = match
  const meta: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const kv = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return { name: meta.name, description: meta.description, body: body.trim() }
}

function firstHeading(body: string): string | undefined {
  const m = body.match(/^#\s+(.+)$/m)
  return m?.[1].trim()
}

export function listSkills(): SkillInfo[] {
  const dir = resolveSkillsDir()
  if (!dir) return []

  let files: string[]
  try {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.md'))
  } catch (err) {
    console.warn('[SkillRegistry] Failed to read skills dir:', err)
    return []
  }

  const skills: SkillInfo[] = []
  for (const file of files.sort()) {
    const full = path.join(dir, file)
    try {
      const parsed = parseFrontmatter(fs.readFileSync(full, 'utf8'))
      const id = path.basename(file, path.extname(file))
      skills.push({
        id,
        name: parsed.name || firstHeading(parsed.body) || id,
        description: parsed.description || '',
        path: full
      })
    } catch (err) {
      console.warn(`[SkillRegistry] Skipping unreadable skill ${file}:`, err)
    }
  }
  return skills
}

/** Conteúdo da skill (sem frontmatter), pronto para ser entregue ao agente. */
export function readSkillBody(id: string): string | null {
  const skill = listSkills().find((s) => s.id === id)
  if (!skill) return null
  try {
    return parseFrontmatter(fs.readFileSync(skill.path, 'utf8')).body
  } catch (err) {
    console.warn(`[SkillRegistry] Failed to read skill ${id}:`, err)
    return null
  }
}

export function findSkill(id: string): SkillInfo | undefined {
  return listSkills().find((s) => s.id === id)
}
