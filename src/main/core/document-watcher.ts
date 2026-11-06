import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { DocumentEvent } from '@shared/types'
import { minicursoDir } from './minicurso-paths'

/**
 * Descobre documentos markdown de duas formas, porque nenhuma sozinha basta:
 *
 * 1. Observando o disco — pega qualquer .md criado ou alterado, mesmo que a CLI
 *    de IA ignore nossas instruções.
 * 2. Lendo anúncios do agente — um JSON que ele grava dizendo qual arquivo abriu
 *    e por quê. O disco não conta a intenção; o anúncio sim.
 */

const POLL_MS = 500
const DEBOUNCE_MS = 300
const IGNORED = new Set(['node_modules', '.git', 'out', 'dist', '.vite', 'build'])
const MAX_BYTES = 256 * 1024

export class DocumentWatcher extends EventEmitter {
  private watcher: fs.FSWatcher | null = null
  private timer: NodeJS.Timeout | null = null
  private debounces = new Map<string, NodeJS.Timeout>()
  private readonly eventsDir: string
  public readonly rootDir: string

  constructor() {
    super()
    this.rootDir = process.env.AGENT_ORCHESTRATOR_WATCH_DIR || minicursoDir('virta') || process.cwd()
    this.eventsDir = path.join(app.getPath('userData'), 'pipeline-status', 'events')
    fs.mkdirSync(this.eventsDir, { recursive: true })
  }

  /** Caminho onde o agente anuncia um documento no meio do turno. */
  public announceDirFor(): string {
    return this.eventsDir
  }

  public start(): void {
    this.startDiskWatch()
    if (!this.timer) this.timer = setInterval(() => this.scanAnnouncements(), POLL_MS)
  }

  public stop(): void {
    this.watcher?.close()
    this.watcher = null
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    for (const t of this.debounces.values()) clearTimeout(t)
    this.debounces.clear()
  }

  private startDiskWatch(): void {
    if (this.watcher) return
    try {
      this.watcher = fs.watch(this.rootDir, { recursive: true }, (_type, filename) => {
        if (!filename) return
        const rel = String(filename)
        if (!rel.toLowerCase().endsWith('.md')) return
        if (rel.split(/[\\/]/).some((part) => IGNORED.has(part))) return
        this.debounced(path.join(this.rootDir, rel))
      })
    } catch (err) {
      // Sem watcher o app continua funcionando; só perde a detecção automática.
      console.warn('[DocumentWatcher] Não foi possível observar', this.rootDir, err)
    }
  }

  /** fs.watch dispara várias vezes por escrita; agrupamos por caminho. */
  private debounced(full: string): void {
    const pending = this.debounces.get(full)
    if (pending) clearTimeout(pending)
    this.debounces.set(
      full,
      setTimeout(() => {
        this.debounces.delete(full)
        this.emitDocument(full, 'disk')
      }, DEBOUNCE_MS)
    )
  }

  private emitDocument(
    full: string,
    origin: 'disk' | 'agent',
    intent?: string,
    from?: string
  ): void {
    const doc = readDocument(full)
    if (!doc) return
    this.emit('document', { ...doc, origin, intent, from } as DocumentEvent)
  }

  private scanAnnouncements(): void {
    let files: string[]
    try {
      files = fs.readdirSync(this.eventsDir).filter((f) => f.endsWith('.json'))
    } catch {
      return
    }

    for (const file of files) {
      const full = path.join(this.eventsDir, file)
      let raw: string
      try {
        raw = fs.readFileSync(full, 'utf8')
      } catch {
        continue
      }
      const text = raw.replace(/^﻿/, '').trim()
      if (!text.endsWith('}')) continue

      let parsed: { document?: unknown; intent?: unknown; from?: unknown }
      try {
        parsed = JSON.parse(text)
      } catch {
        fs.rmSync(full, { force: true })
        continue
      }
      fs.rmSync(full, { force: true })

      if (typeof parsed.document !== 'string') continue
      const target = path.isAbsolute(parsed.document)
        ? parsed.document
        : path.join(this.rootDir, parsed.document)
      // 'from' é o ORCHESTRATOR_TERMINAL_ID de quem anunciou: é o que deixa o
      // canvas mostrar de qual agente o documento saiu.
      this.emitDocument(
        target,
        'agent',
        typeof parsed.intent === 'string' ? parsed.intent : undefined,
        typeof parsed.from === 'string' ? parsed.from : undefined
      )
    }
  }
}

export function readDocument(
  full: string
): { path: string; name: string; content: string; truncated: boolean } | null {
  try {
    const stat = fs.statSync(full)
    if (!stat.isFile()) return null
    const truncated = stat.size > MAX_BYTES
    const fd = fs.openSync(full, 'r')
    try {
      const buf = Buffer.alloc(Math.min(stat.size, MAX_BYTES))
      fs.readSync(fd, buf, 0, buf.length, 0)
      return {
        path: full,
        name: path.basename(full),
        content: buf.toString('utf8').replace(/^﻿/, ''),
        truncated
      }
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return null
  }
}

export function writeDocument(full: string, content: string): boolean {
  try {
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, 'utf8')
    return true
  } catch (err) {
    console.warn('[DocumentWatcher] Falha ao gravar', full, err)
    return false
  }
}

export const documentWatcher = new DocumentWatcher()
