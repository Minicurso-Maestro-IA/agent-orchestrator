import { EventEmitter } from 'events'
import * as os from 'os'
import * as crypto from 'crypto'
import * as pty from 'node-pty'
import {
  TerminalInfo,
  TerminalSpawnOptions,
  TerminalDataEvent,
  TerminalExitEvent,
  TerminalShell,
  AgentDefinition
} from '@shared/types'
import { listAgents, findAgent } from './agent-registry'
import { findSkill, readSkillBody } from './skill-registry'
import { pipelineWatcher } from './pipeline-watcher'
import { documentWatcher } from './document-watcher'

interface ActivePtySession {
  info: TerminalInfo
  ptyProcess: pty.IPty
  timers: NodeJS.Timeout[]
  inputBuffer?: string
}

/** Espera no máximo isso pelo prompt do shell antes de mandar o comando mesmo assim. */
const SHELL_PROMPT_TIMEOUT_MS = 4000
/** Um chunk desse tamanho já indica prompt desenhado, não só escapes de modo do ConPTY. */
const PROMPT_CHUNK_MIN_LEN = 20

export class PtyManager extends EventEmitter {
  private sessions = new Map<string, ActivePtySession>()

  private resolveShell(shell: TerminalShell): { file: string; args: string[] } {
    const isWin = os.platform() === 'win32'

    if (isWin) {
      const systemRoot = process.env.SystemRoot || 'C:\\Windows'
      switch (shell) {
        case 'powershell':
          return {
            file: `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
            args: ['-NoLogo']
          }
        case 'cmd':
          return {
            file: process.env.ComSpec || `${systemRoot}\\System32\\cmd.exe`,
            args: []
          }
        case 'wsl':
          return {
            file: `${systemRoot}\\System32\\wsl.exe`,
            args: []
          }
        default:
          return {
            file: `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
            args: ['-NoLogo']
          }
      }
    } else {
      // Non-windows environments (Linux / macOS)
      const defaultShell = process.env.SHELL || '/bin/bash'
      return {
        file: defaultShell,
        args: []
      }
    }
  }

  public spawn(options: TerminalSpawnOptions = {}): TerminalInfo {
    const id = options.id || crypto.randomUUID()
    const shell: TerminalShell = options.shell || 'powershell'
    const { file, args } = this.resolveShell(shell)

    const cols = options.cols || 80
    const rows = options.rows || 24
    const cwd = options.cwd || process.env.USERPROFILE || process.env.HOME || process.cwd()

    const isWin = os.platform() === 'win32'
    const env = {
      ...process.env,
      ...options.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      // O agente grava aqui o veredito do seu turno; o PipelineWatcher lê e rotea.
      ORCHESTRATOR_STATUS_FILE: pipelineWatcher.statusFileFor(id),
      // Onde o agente anuncia um documento que abriu no meio do turno.
      ORCHESTRATOR_EVENTS_DIR: documentWatcher.announceDirFor()
    } as Record<string, string>

    const ptyProcess = pty.spawn(file, args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env,
      useConpty: isWin,
      // Usa a conpty.dll empacotada pelo node-pty. Sem isso, kill() recorre a um
      // helper forkado (conpty_console_list_agent) que falha com "AttachConsole
      // failed" dentro do Electron, espera 5s no timeout e deixa processos filhos
      // órfãos ao fechar um terminal.
      useConptyDll: isWin
    })

    const agent = options.agentId ? findAgent(options.agentId) : undefined
    const skill = options.skillId ? findSkill(options.skillId) : undefined

    const title = agent
      ? `${agent.label} #${id.slice(0, 4)}`
      : `${shell.toUpperCase()} #${id.slice(0, 4)}`

    const info: TerminalInfo = {
      id,
      shell,
      pid: ptyProcess.pid,
      title,
      cwd,
      createdAt: Date.now(),
      agentId: agent?.id,
      agentLabel: agent?.label,
      skillId: skill?.id,
      skillName: skill?.name
    }

    const session: ActivePtySession = { info, ptyProcess, timers: [] }
    this.sessions.set(id, session)

    let bootstrapped = false
    const bootstrap = (): void => {
      if (bootstrapped) return
      bootstrapped = true
      if (agent) this.startAgent(id, agent, options.skillId)
    }

    ptyProcess.onData((data: string) => {
      const event: TerminalDataEvent = { id, data }
      this.emit('data', event)
      // O prompt do shell pode demorar (PowerShell leva ~1.4s). Só mandamos o
      // comando do agente depois que ele aparece, senão o eco sai embaralhado.
      if (agent && !bootstrapped && data.length >= PROMPT_CHUNK_MIN_LEN) bootstrap()
    })

    if (agent) {
      session.timers.push(setTimeout(bootstrap, SHELL_PROMPT_TIMEOUT_MS))
    }

    ptyProcess.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
      const s = this.sessions.get(id)
      s?.timers.forEach(clearTimeout)
      this.sessions.delete(id)
      const event: TerminalExitEvent = { id, exitCode, signal }
      this.emit('exit', event)
    })

    return info
  }

  /** Mensagem informativa escrita na tela do terminal (não vai para o stdin do shell). */
  public notify(id: string, text: string): void {
    this.emit('data', { id, data: `\r\n\x1b[38;5;39m${text}\x1b[0m\r\n` } as TerminalDataEvent)
  }

  /**
   * Instruções de pipeline anexadas à skill. É o que torna o veredito detectável:
   * sem isso o agente termina o turno e ninguém fica sabendo.
   */
  private protocolText(id: string): string {
    const file = pipelineWatcher.statusFileFor(id)
    return [
      '## Protocolo de orquestração',
      '',
      'Você faz parte de um pipeline de agentes. Ao concluir sua tarefa, sua ÚLTIMA ação',
      'deve ser gravar exatamente este arquivo JSON:',
      '',
      file,
      '',
      '{ "status": "approved", "reason": "<uma frase>", "files": ["<arquivos tocados>"] }',
      '',
      'Use "rejected" no lugar de "approved" apenas se você está revisando um trabalho e',
      'ele precisa de ajustes — nesse caso explique em "reason" o que deve ser corrigido.',
      'Se você não está revisando nada, use "approved" ao terminar sua parte.',
      'Grave o arquivo mesmo que a tarefa tenha falhado, explicando o motivo em "reason".',
      '',
      '### Mostrando um documento no canvas',
      '',
      'Se abrir um .md relevante (uma regra, uma especificação, um checklist) e quiser',
      'que ele apareça no orquestrador, grave um JSON de nome único nesta pasta:',
      '',
      documentWatcher.announceDirFor(),
      '',
      '{ "document": "<caminho do .md>", "intent": "<por que você abriu>" }'
    ].join('\n')
  }

  /** Entrega um prompt a um agente já em execução. Usado pelo roteamento do pipeline. */
  public injectProtocol(id: string): boolean {
    return this.sendPrompt(id, this.protocolText(id))
  }

  public sendPrompt(id: string, text: string): boolean {
    const session = this.sessions.get(id)
    if (!session) return false
    const payload = text.replace(/\r?\n/g, '\r')
    session.ptyProcess.write(`\x1b[200~${payload}\x1b[201~`)
    session.timers.push(setTimeout(() => this.sessions.get(id)?.ptyProcess.write('\r'), 250))
    return true
  }

  private quoteArg(value: string): string {
    if (!/[\s"']/.test(value)) return value
    return `"${value.replace(/"/g, '\\"')}"`
  }

  private startAgent(id: string, agent: AgentDefinition, skillId?: string): void {
    const session = this.sessions.get(id)
    if (!session) return

    const skill = skillId ? findSkill(skillId) : undefined
    const delivery = agent.delivery || 'paste'

    const parts = [agent.command, ...(agent.args || [])]
    if (skill && delivery === 'arg' && agent.skillArgs?.length) {
      for (const raw of agent.skillArgs) {
        parts.push(
          this.quoteArg(raw.replace(/\{skillFile\}/g, skill.path).replace(/\{skillName\}/g, skill.name))
        )
      }
    }

    this.notify(
      id,
      `▸ Iniciando ${agent.label}${skill ? ` com a skill "${skill.name}"` : ''}...` +
        (agent.install ? `  (se falhar: ${agent.install})` : '')
    )

    session.ptyProcess.write(parts.join(' ') + '\r')

    if (delivery !== 'paste') return

    // O protocolo vai junto da skill num colar só: o agente precisa dele para
    // participar do pipeline, mesmo quando nenhuma skill foi escolhida.
    const blocks: string[] = []
    if (skill) {
      const body = readSkillBody(skill.id)
      if (body) blocks.push(body)
      else this.notify(id, `▸ Skill "${skill.name}" não pôde ser lida; seguindo sem contexto.`)
    }
    blocks.push(this.protocolText(id))

    const payload = blocks.join('\n\n---\n\n').replace(/\r?\n/g, '\r')
    session.timers.push(
      setTimeout(() => {
        const live = this.sessions.get(id)
        if (!live) return
        // Bracketed paste: a CLI recebe o markdown inteiro como um colar só, sem
        // tratar cada quebra de linha como Enter. Funciona sem depender de flags.
        live.ptyProcess.write(`\x1b[200~${payload}\x1b[201~`)
        live.timers.push(setTimeout(() => this.sessions.get(id)?.ptyProcess.write('\r'), 250))
      }, agent.readyDelayMs ?? 4000)
    )
  }

  public write(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (!session) return

    session.ptyProcess.write(data)

    if (!session.info.agentId) {
      if (data.includes('\r') || data.includes('\n')) {
        const fullLine = ((session.inputBuffer || '') + data).trim().toLowerCase()
        session.inputBuffer = ''
        const matched = listAgents().find(
          (a) => fullLine === a.command.toLowerCase() || fullLine.startsWith(a.command.toLowerCase() + ' ')
        )
        if (matched) {
          session.info.agentId = matched.id
          session.info.agentLabel = matched.label
          session.timers.push(
            setTimeout(() => {
              this.injectProtocol(id)
            }, matched.readyDelayMs ?? 4000)
          )
        }
      } else if (!data.startsWith('\x1b')) {
        session.inputBuffer = (session.inputBuffer || '') + data
        if (session.inputBuffer.length > 256) session.inputBuffer = ''
      }
    }
  }

  public resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id)
    if (session && cols > 0 && rows > 0) {
      try {
        session.ptyProcess.resize(cols, rows)
      } catch (err) {
        console.warn(`[PtyManager] Failed to resize session ${id}:`, err)
      }
    }
  }

  public kill(id: string): boolean {
    const session = this.sessions.get(id)
    if (session) {
      session.timers.forEach(clearTimeout)
      try {
        session.ptyProcess.kill()
      } catch (err) {
        console.warn(`[PtyManager] Error killing process ${id}:`, err)
      }
      this.sessions.delete(id)
      pipelineWatcher.clear(id)
      return true
    }
    return false
  }

  public list(): TerminalInfo[] {
    return Array.from(this.sessions.values()).map((s) => s.info)
  }

  public killAll(): void {
    for (const [id, session] of this.sessions) {
      session.timers.forEach(clearTimeout)
      pipelineWatcher.clear(id)
      try {
        session.ptyProcess.kill()
      } catch {
        // ignore on exit
      }
    }
    this.sessions.clear()
  }

  public onData(callback: (event: TerminalDataEvent) => void): this {
    return this.on('data', callback)
  }

  public onExit(callback: (event: TerminalExitEvent) => void): this {
    return this.on('exit', callback)
  }
}

export const ptyManager = new PtyManager()
