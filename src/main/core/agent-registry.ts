import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { AgentDefinition } from '@shared/types'

/**
 * Catálogo de CLIs de IA. Vem de um `agents.json` na raiz do projeto para que
 * flags possam ser ajustadas sem recompilar — as CLIs mudam de interface com
 * frequência e nenhuma delas está instalada por padrão.
 */

const BUILT_IN: AgentDefinition[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    command: 'claude',
    delivery: 'paste',
    readyDelayMs: 4000,
    description: 'CLI agêntica da Anthropic',
    install: 'npm i -g @anthropic-ai/claude-code'
  },
  {
    id: 'antigravity',
    label: 'Antigravity CLI',
    command: 'agy',
    delivery: 'paste',
    readyDelayMs: 4000,
    description: 'CLI do Google Antigravity',
    install: 'npm i -g agy'
  },
  {
    id: 'codex',
    label: 'Codex CLI',
    command: 'codex',
    delivery: 'paste',
    readyDelayMs: 4000,
    description: 'CLI de codificação da OpenAI',
    install: 'npm i -g @openai/codex'
  }
]

function candidateFiles(): string[] {
  return [
    process.env.AGENT_ORCHESTRATOR_AGENTS_FILE,
    path.join(process.cwd(), 'agents.json'),
    // O .exe portátil se extrai numa pasta temporária; esta é a pasta onde ele de fato está.
    process.env.PORTABLE_EXECUTABLE_DIR && path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'agents.json'),
    path.join(app.getAppPath(), 'agents.json'),
    path.join(path.dirname(app.getPath('exe')), 'agents.json')
  ].filter((f): f is string => !!f)
}

function isValid(a: unknown): a is AgentDefinition {
  const o = a as AgentDefinition
  return !!o && typeof o.id === 'string' && typeof o.label === 'string' && typeof o.command === 'string'
}

export function listAgents(): AgentDefinition[] {
  for (const file of candidateFiles()) {
    try {
      if (!fs.existsSync(file)) continue
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
      const raw = Array.isArray(parsed) ? parsed : parsed?.agents
      if (!Array.isArray(raw)) {
        console.warn(`[AgentRegistry] ${file} não contém um array de agentes; usando o catálogo padrão.`)
        continue
      }
      const agents = raw.filter(isValid)
      if (agents.length !== raw.length) {
        console.warn(`[AgentRegistry] ${raw.length - agents.length} entrada(s) inválida(s) ignorada(s) em ${file}.`)
      }
      if (agents.length) return agents
    } catch (err) {
      console.warn(`[AgentRegistry] Falha ao ler ${file}:`, err)
    }
  }
  return BUILT_IN
}

export function findAgent(id: string): AgentDefinition | undefined {
  return listAgents().find((a) => a.id === id)
}
