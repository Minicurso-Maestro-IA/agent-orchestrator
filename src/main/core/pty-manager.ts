import { EventEmitter } from 'events'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { app } from 'electron'
import * as pty from 'node-pty'
import {
  TerminalInfo,
  TerminalSpawnOptions,
  TerminalDataEvent,
  TerminalExitEvent,
  TerminalActivity,
  TerminalActivityEvent,
  TerminalShell,
  AgentDefinition
} from '@shared/types'
import { listAgents, findAgent } from './agent-registry'
import { findSkill, readSkillBody } from './skill-registry'
import type { SkillInfo } from '@shared/types'
import { pipelineWatcher } from './pipeline-watcher'
import { clearClaudeSettings, writeClaudeSettings } from './claude-hooks'
import { traceWatcher } from './trace-watcher'
import { documentWatcher } from './document-watcher'

interface ActivePtySession {
  info: TerminalInfo
  ptyProcess: pty.IPty
  timers: NodeJS.Timeout[]
  activity: TerminalActivity
  /** Desarmado a cada byte: é o que faz 'working' voltar a 'idle' sozinho. */
  quiet: NodeJS.Timeout | null
  /** O que foi digitado desde o último Enter, para reconhecer uma CLI aberta na mão. */
  inputBuffer?: string
}

/** Espera no máximo isso pelo prompt do shell antes de mandar o comando mesmo assim. */
const SHELL_PROMPT_TIMEOUT_MS = 4000
/** Um chunk desse tamanho já indica prompt desenhado, não só escapes de modo do ConPTY. */
const PROMPT_CHUNK_MIN_LEN = 20
/**
 * Silêncio que separa 'working' de 'idle'. Curto demais pisca a cada pausa do
 * agente entre tokens; longo demais faz o nó parecer ocupado depois de pronto.
 */
const QUIET_MS = 1200

/**
 * Fecho do prompt de um agente que recebeu o papel sem tarefa. A tarefa chega
 * depois — digitada no terminal, ou entregue pelo pipeline — e ele precisa já
 * estar com o papel e o protocolo na cabeça quando ela chegar.
 */
const AGUARDE_TAREFA = [
  '## Agora: espere a tarefa',
  '',
  'Ainda não há tarefa. NÃO leia arquivos, NÃO explore a pasta e NÃO comece nada.',
  'Responda apenas: "Pronto. Aguardando a tarefa." — e pare.',
  'A próxima mensagem que chegar é a tarefa: trate-a seguindo o seu papel acima e',
  'termine gravando o arquivo de status do protocolo.'
].join('\n')

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
    // AGENT_ORCHESTRATOR_TERMINAL_CWD existe para sala de aula e demo: faz todo
    // terminal novo nascer na pasta de trabalho do exercício, em vez da home do
    // usuário. Mesma convenção das outras variáveis AGENT_ORCHESTRATOR_*.
    const cwd =
      options.cwd ||
      process.env.AGENT_ORCHESTRATOR_TERMINAL_CWD ||
      process.env.USERPROFILE ||
      process.env.HOME ||
      process.cwd()

    const isWin = os.platform() === 'win32'
    const env = {
      ...process.env,
      ...options.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      // O agente grava aqui o veredito do seu turno; o PipelineWatcher lê e rotea.
      ORCHESTRATOR_STATUS_FILE: pipelineWatcher.statusFileFor(id),
      // Onde o agente anuncia um documento, ou pede a criação de outro agente.
      ORCHESTRATOR_EVENTS_DIR: documentWatcher.announceDirFor(),
      // O agente precisa saber quem ele é para pedir um agente ligado a si mesmo.
      ORCHESTRATOR_TERMINAL_ID: id,
      // Onde o hook de ferramenta grava o rastro que aparece no nó.
      ORCHESTRATOR_TRACE_FILE: traceWatcher.traceFileFor(id)
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

    const session: ActivePtySession = {
      info,
      ptyProcess,
      timers: [],
      activity: 'idle',
      quiet: null
    }
    this.sessions.set(id, session)

    let bootstrapped = false
    const bootstrap = (): void => {
      if (bootstrapped) return
      bootstrapped = true
      // A CLI sobe sempre — o nó tem de mostrar o agente de pé. O que
      // autoStart:false segura é o contexto: sem skill, ele não começa nada.
      if (agent) {
        this.startAgent(id, agent, options.skillId, options.task, options.autoStart !== false)
      }
    }

    ptyProcess.onData((data: string) => {
      const event: TerminalDataEvent = { id, data }
      this.emit('data', event)
      this.markBusy(id)
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
      if (s?.quiet) clearTimeout(s.quiet)
      this.setActivity(id, 'stopped')
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
      'EXCEÇÃO: se você precisa de uma resposta da pessoa para continuar, NÃO grave o',
      'arquivo. Faça a pergunta aqui no terminal e espere a resposta. Gravar o status',
      'passa o trabalho adiante na hora — o próximo agente seguiria sem a resposta.',
      '',
      '### Mostrando um documento no canvas',
      '',
      'Se abrir um .md relevante (uma regra, uma especificação, um checklist) e quiser',
      'que ele apareça no iFlow, grave um JSON de nome único nesta pasta:',
      '',
      documentWatcher.announceDirFor(),
      '',
      `{ "document": "<caminho do .md>", "intent": "<por que você abriu>", "from": "${id}" }`,
      '',
      'O campo "from" já vem preenchido acima com o seu identificador: copie-o como está.',
      'É ele que liga o documento a você no canvas; sem ele o nó aparece solto e',
      'ninguém sabe de qual agente o arquivo saiu.',
      '',
      '### Criando outro agente',
      '',
      'Se a tarefa se divide em frentes independentes, você pode pedir um agente novo',
      'em vez de fazer tudo sozinho. Grave um JSON de nome único na MESMA pasta acima:',
      '',
      `{ "spawn": "Revisor", "from": "${id}", "task": "<o pedido completo>", "agent": "<id opcional>", "skill": "<id opcional>" }`,
      '',
      'Ele nasce no canvas ligado a você, com a tarefa já entregue. Escreva o pedido',
      'completo e independente: o outro agente não vê a sua conversa. Peça um agente',
      'só quando as frentes forem de fato paralelas — cada um consome cota.'
    ].join('\n')
  }

  /** Injeta só o protocolo numa CLI que já está rodando. */
  public injectProtocol(id: string): boolean {
    return this.sendPrompt(id, `${this.protocolText(id)}\n\n---\n\n${AGUARDE_TAREFA}`)
  }

  /** Entrega um prompt a um agente já em execução. Usado pelo roteamento do pipeline. */
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

  /** Skill, tarefa e protocolo, na ordem em que o agente deve lê-los. */
  private composePrompt(id: string, skill: SkillInfo | undefined, task?: string): string {
    const blocks: string[] = []
    if (skill) {
      const body = readSkillBody(skill.id)
      if (body) blocks.push(body)
      else this.notify(id, `▸ Skill "${skill.name}" não pôde ser lida; seguindo sem contexto.`)
    }
    if (task) blocks.push(`## Sua tarefa\n\n${task}`)
    // Sempre vai, mesmo sem skill: sem ele o agente não participa do pipeline.
    blocks.push(this.protocolText(id))
    // Papel entregue sem tarefa: sem esta ordem o agente improvisa — sai lendo
    // os arquivos da pasta e inventando trabalho. Ele tem de saber quem é e
    // esperar, para que o pedido digitado depois caia num agente que já tem
    // o papel e o protocolo.
    if (!task) blocks.push(AGUARDE_TAREFA)
    return blocks.join('\n\n---\n\n')
  }

  /**
   * Grava o prompt inicial em disco para a CLI abrir. Passar o texto por arquivo
   * evita dois problemas de uma vez: o inferno de aspas e quebras de linha num
   * argumento de linha de comando, e a espera cega do `paste`, que depende de a
   * CLI ter subido dentro de readyDelayMs.
   */
  private writePromptFile(id: string, text: string): string | null {
    try {
      const dir = path.join(app.getPath('userData'), 'prompts')
      fs.mkdirSync(dir, { recursive: true })
      const file = path.join(dir, `${id}.md`)
      fs.writeFileSync(file, text, 'utf8')
      return file
    } catch (err) {
      console.warn('[PtyManager] Falha ao gravar o prompt inicial:', err)
      return null
    }
  }

  private clearPromptFile(id: string): void {
    try {
      fs.rmSync(path.join(app.getPath('userData'), 'prompts', `${id}.md`), { force: true })
    } catch {
      // o arquivo pode nem ter sido criado
    }
  }

  /**
   * Entrega a skill (e, opcionalmente, uma tarefa) a uma CLI que já está de pé.
   * É o segundo tempo do nó criado parado: a CLI subiu junto com o nó, mas sem
   * contexto, e só começa a trabalhar quando este prompt chega.
   */
  public deliverSkill(id: string, skillId?: string, task?: string): boolean {
    if (!this.sessions.has(id)) return false
    const skill = skillId ? findSkill(skillId) : undefined
    return this.sendPrompt(id, this.composePrompt(id, skill, task))
  }

  private startAgent(
    id: string,
    agent: AgentDefinition,
    skillId?: string,
    task?: string,
    comPrompt = true
  ): void {
    const session = this.sessions.get(id)
    if (!session) return

    const skill = skillId ? findSkill(skillId) : undefined
    const delivery = agent.delivery || 'paste'
    const prompt = this.composePrompt(id, skill, task)

    const parts = [agent.command, ...(agent.args || [])]

    // comPrompt:false sobe a CLI pelada — sem skill, sem protocolo, sem tarefa.
    // O terminal mostra o agente de pé e parado, esperando. É o que permite
    // montar o pipeline sem que três agentes comecem a trabalhar de uma vez.
    if (comPrompt && delivery === 'arg' && agent.skillArgs?.length) {
      // \u0000 não aparece em caminho nem em nome de skill: serve só para
      // procurar os placeholders no conjunto dos argumentos de uma vez.
      const template = agent.skillArgs.join('\u0000')
      const wantsPromptFile = template.includes('{promptFile}')
      const wantsRawSkill = /\{skillFile\}|\{skillName\}/.test(template)
      const settingsFile = template.includes('{claudeSettings}')
        ? writeClaudeSettings(id)
        : null

      // Um template que só sabe pedir a skill crua não tem o que fazer sem skill.
      if (!wantsRawSkill || skill) {
        const promptFile = wantsPromptFile ? this.writePromptFile(id, prompt) : null
        if (wantsPromptFile && !promptFile) {
          this.notify(id, '▸ Não consegui preparar o contexto inicial; o agente sobe sem ele.')
        } else if (template.includes('{claudeSettings}') && !settingsFile) {
          // Passar --settings com caminho vazio faria a CLI recusar o argumento.
          this.notify(
            id,
            '▸ Configuração da sessão indisponível: o agente vai pedir confirmação para gravar arquivos.'
          )
          for (const raw of agent.skillArgs) {
            if (raw.includes('{claudeSettings}')) continue
            if (raw === '--settings') continue
            parts.push(
              this.quoteArg(
                raw
                  .replace(/\{promptFile\}/g, promptFile ?? '')
                  .replace(/\{skillFile\}/g, skill?.path ?? '')
                  .replace(/\{skillName\}/g, skill?.name ?? '')
              )
            )
          }
        } else {
          for (const raw of agent.skillArgs) {
            parts.push(
              this.quoteArg(
                raw
                  .replace(/\{claudeSettings\}/g, settingsFile ?? '')
                  .replace(/\{promptFile\}/g, promptFile ?? '')
                  .replace(/\{skillFile\}/g, skill?.path ?? '')
                  .replace(/\{skillName\}/g, skill?.name ?? '')
              )
            )
          }
        }
      }
    }

    this.notify(
      id,
      comPrompt
        ? `▸ Iniciando ${agent.label}${skill ? ` com a skill "${skill.name}"` : ''}...` +
            (agent.install ? `  (se falhar: ${agent.install})` : '')
        : `▸ Iniciando ${agent.label} sem contexto. A skill` +
            `${skill ? ` "${skill.name}"` : ''} é entregue quando você apertar Começar,` +
            ' ou quando o pipeline mandar trabalho para este nó.'
    )

    session.ptyProcess.write(parts.join(' ') + '\r')

    if (!comPrompt || delivery !== 'paste') return

    const payload = prompt.replace(/\r?\n/g, '\r')
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

  // --- Atividade do nó -------------------------------------------------------

  private setActivity(id: string, activity: TerminalActivity): void {
    const session = this.sessions.get(id)
    // 'stopped' é emitido durante o encerramento, quando a sessão ainda existe
    // mas já não importa o estado anterior.
    if (session && session.activity === activity) return
    if (session) session.activity = activity
    const event: TerminalActivityEvent = { id, activity, since: Date.now() }
    this.emit('activity', event)
  }

  /** Byte recebido: o nó está trabalhando, e volta a ocioso depois do silêncio. */
  private markBusy(id: string): void {
    const session = this.sessions.get(id)
    if (!session) return
    this.setActivity(id, 'working')
    if (session.quiet) clearTimeout(session.quiet)
    session.quiet = setTimeout(() => this.setActivity(id, 'idle'), QUIET_MS)
  }

  public write(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (!session) return

    session.ptyProcess.write(data)

    // Terminal aberto sem IA: se a pessoa digitar o comando de uma CLI do
    // catálogo, o nó entra no pipeline sozinho e recebe o protocolo. Sem isso,
    // quem não usou o modal fica de fora e não há nada na tela que explique.
    if (session.info.agentId) return

    if (data.includes('\r') || data.includes('\n')) {
      const linha = ((session.inputBuffer || '') + data).trim().toLowerCase()
      session.inputBuffer = ''
      const agente = listAgents().find(
        (a) => linha === a.command.toLowerCase() || linha.startsWith(a.command.toLowerCase() + ' ')
      )
      if (agente) {
        session.info.agentId = agente.id
        session.info.agentLabel = agente.label
        this.emit('info', { ...session.info } as TerminalInfo)
        session.timers.push(
          setTimeout(() => this.injectProtocol(id), agente.readyDelayMs ?? 4000)
        )
      }
    } else if (!data.startsWith('\x1b')) {
      session.inputBuffer = (session.inputBuffer || '') + data
      if (session.inputBuffer.length > 256) session.inputBuffer = ''
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
      if (session.quiet) clearTimeout(session.quiet)
      try {
        session.ptyProcess.kill()
      } catch (err) {
        console.warn(`[PtyManager] Error killing process ${id}:`, err)
      }
      this.sessions.delete(id)
      pipelineWatcher.clear(id)
      this.clearPromptFile(id)
      clearClaudeSettings(id)
      traceWatcher.clear(id)
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
      if (session.quiet) clearTimeout(session.quiet)
      pipelineWatcher.clear(id)
      this.clearPromptFile(id)
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

  public onActivity(callback: (event: TerminalActivityEvent) => void): this {
    return this.on('activity', callback)
  }

  /**
   * O TerminalInfo mudou depois de criado — hoje só quando uma CLI é
   * reconhecida pelo que foi digitado. Sem este evento o processo principal
   * sabe que o nó virou agente e a tela não, e aí o seletor continua vazio e o
   * protocolo é injetado de novo a cada conexão nova.
   */
  public onInfo(callback: (info: TerminalInfo) => void): this {
    return this.on('info', callback)
  }
}

export const ptyManager = new PtyManager()
