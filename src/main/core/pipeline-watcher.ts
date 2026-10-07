import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { PipelineStatus, PipelineStatusEvent } from '@shared/types'

/**
 * Os agentes sinalizam o fim de um turno gravando um JSON em STATUS_DIR.
 * Lemos por polling em vez de fs.watch: é imune às diferenças de plataforma e
 * aos eventos duplicados que o fs.watch dispara no Windows durante uma escrita.
 *
 * O arquivo é apagado assim que consumido — é isso que impede o mesmo veredito
 * de disparar o roteamento repetidas vezes.
 */

const POLL_MS = 400

function isStatus(value: unknown): value is PipelineStatus {
  return value === 'approved' || value === 'rejected'
}

export class PipelineWatcher extends EventEmitter {
  private timer: NodeJS.Timeout | null = null
  private readonly dir: string

  constructor() {
    super()
    this.dir = path.join(app.getPath('userData'), 'pipeline-status')
    fs.mkdirSync(this.dir, { recursive: true })
  }

  /** Caminho absoluto que o agente deste terminal deve escrever ao terminar. */
  public statusFileFor(terminalId: string): string {
    return path.join(this.dir, `${terminalId}.json`)
  }

  public start(): void {
    if (this.timer) return
    this.timer = setInterval(() => this.scan(), POLL_MS)
  }

  public stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  /** Remove o status pendente de um terminal (usado ao fechá-lo). */
  public clear(terminalId: string): void {
    try {
      fs.rmSync(this.statusFileFor(terminalId), { force: true })
    } catch {
      // nada a fazer: o arquivo pode nem existir
    }
  }

  private scan(): void {
    let files: string[]
    try {
      files = fs.readdirSync(this.dir).filter((f) => f.endsWith('.json'))
    } catch {
      return
    }

    for (const file of files) {
      const full = path.join(this.dir, file)
      let raw: string
      try {
        raw = fs.readFileSync(full, 'utf8')
      } catch {
        continue // provavelmente ainda sendo escrito; tentamos no próximo ciclo
      }

      // Out-File do PowerShell e vários editores gravam UTF-8 com BOM, que
      // quebra o JSON.parse se não for removido.
      const text = raw.replace(/^﻿/, '').trim()

      // Escrita incompleta: espera o próximo ciclo em vez de descartar.
      if (!text.endsWith('}')) continue

      let parsed: { status?: unknown; reason?: unknown; files?: unknown }
      try {
        parsed = JSON.parse(text)
      } catch {
        continue
      }

      if (!isStatus(parsed.status)) {
        console.warn(`[PipelineWatcher] ${file}: status inválido (${String(parsed.status)}); ignorado.`)
        fs.rmSync(full, { force: true })
        continue
      }

      fs.rmSync(full, { force: true })

      const event: PipelineStatusEvent = {
        terminalId: path.basename(file, '.json'),
        status: parsed.status,
        reason: typeof parsed.reason === 'string' ? parsed.reason : undefined,
        files: Array.isArray(parsed.files) ? parsed.files.filter((f) => typeof f === 'string') : undefined
      }
      this.emit('status', event)
    }
  }
}

export const pipelineWatcher = new PipelineWatcher()
