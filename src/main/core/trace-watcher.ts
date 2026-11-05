import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { TraceEvent } from '@shared/types'

/**
 * Lê o rastro de ações que o hook PostToolUse do Claude Code grava, uma linha
 * JSON por ferramenta usada, e repassa ao canvas.
 *
 * Isso existe para a sala de aula: o terminal já mostra o que o agente faz, mas
 * em prosa e rolando para fora da tela. O aluno precisa bater o olho no nó e
 * entender o que aquela IA está fazendo agora.
 *
 * Polling, como nos outros observadores: imune às diferenças de plataforma e aos
 * eventos duplicados que o fs.watch dispara no Windows durante uma escrita.
 *
 * Em vez de reler o arquivo a cada ciclo, guardamos quantos bytes já foram
 * consumidos de cada um e lemos só o que chegou depois — um agente que roda por
 * uma hora gera um arquivo grande, e reprocessá-lo 2 vezes por segundo seria
 * desperdício puro.
 */

const POLL_MS = 500
/** Linha incompleta: o hook pode estar escrevendo neste instante. */
const MAX_LINHA = 8 * 1024

export class TraceWatcher extends EventEmitter {
  private timer: NodeJS.Timeout | null = null
  private offsets = new Map<string, number>()
  private readonly dir: string

  constructor() {
    super()
    this.dir = path.join(app.getPath('userData'), 'traces')
    fs.mkdirSync(this.dir, { recursive: true })
  }

  /** Caminho onde o hook deste terminal grava as ações. */
  public traceFileFor(terminalId: string): string {
    return path.join(this.dir, `${terminalId}.jsonl`)
  }

  public start(): void {
    if (!this.timer) this.timer = setInterval(() => this.scan(), POLL_MS)
  }

  public stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  public clear(terminalId: string): void {
    const file = this.traceFileFor(terminalId)
    this.offsets.delete(file)
    try {
      fs.rmSync(file, { force: true })
    } catch {
      // o arquivo pode nem existir
    }
  }

  private scan(): void {
    let files: string[]
    try {
      files = fs.readdirSync(this.dir).filter((f) => f.endsWith('.jsonl'))
    } catch {
      return
    }

    for (const file of files) {
      const full = path.join(this.dir, file)
      const terminalId = path.basename(file, '.jsonl')
      this.drain(full, terminalId)
    }
  }

  private drain(full: string, terminalId: string): void {
    let size: number
    try {
      size = fs.statSync(full).size
    } catch {
      return
    }

    const lido = this.offsets.get(full) ?? 0
    // Arquivo encolheu: foi recriado. Recomeça do zero em vez de ler lixo.
    if (size < lido) this.offsets.set(full, 0)
    if (size === (this.offsets.get(full) ?? 0)) return

    const inicio = this.offsets.get(full) ?? 0
    let texto = ''
    try {
      const fd = fs.openSync(full, 'r')
      try {
        const buf = Buffer.alloc(size - inicio)
        fs.readSync(fd, buf, 0, buf.length, inicio)
        texto = buf.toString('utf8')
      } finally {
        fs.closeSync(fd)
      }
    } catch {
      return
    }

    // A última linha pode estar pela metade: deixa o resto para o próximo ciclo.
    const ultimaQuebra = texto.lastIndexOf('\n')
    if (ultimaQuebra < 0) {
      // Nada completo ainda. Se passou do limite, a linha está corrompida: descarta.
      if (texto.length > MAX_LINHA) this.offsets.set(full, size)
      return
    }

    this.offsets.set(full, inicio + Buffer.byteLength(texto.slice(0, ultimaQuebra + 1), 'utf8'))

    for (const linha of texto.slice(0, ultimaQuebra).split('\n')) {
      const limpa = linha.trim()
      if (!limpa) continue
      try {
        const parsed = JSON.parse(limpa) as Partial<TraceEvent>
        if (typeof parsed.tool !== 'string') continue
        this.emit('trace', {
          terminalId,
          tool: parsed.tool,
          label: typeof parsed.label === 'string' ? parsed.label : '',
          at: typeof parsed.at === 'number' ? parsed.at : Date.now(),
          ms: typeof parsed.ms === 'number' ? parsed.ms : undefined
        } as TraceEvent)
      } catch {
        // linha inválida: ignora e segue
      }
    }
  }
}

export const traceWatcher = new TraceWatcher()
