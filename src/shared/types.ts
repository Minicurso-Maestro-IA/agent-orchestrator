export type TerminalShell = 'powershell' | 'cmd' | 'wsl'

/**
 * Como o conteúdo da skill chega até a CLI de IA.
 * - 'paste': abre a CLI e entrega a skill como um "colar" (bracketed paste) seguido de Enter.
 *   Funciona com qualquer CLI interativa, sem depender de flags específicas.
 * - 'arg': passa o conteúdo da skill como argumento, usando `skillArgs` como template.
 */
export type SkillDelivery = 'paste' | 'arg'

export interface AgentDefinition {
  id: string
  label: string
  /** Executável chamado no shell. Ex: 'claude', 'gemini', 'codex'. */
  command: string
  /** Argumentos fixos, sempre passados. */
  args?: string[]
  /**
   * Usado quando delivery === 'arg'. Placeholders suportados:
   * `{skillFile}` (caminho absoluto do .md) e `{skillName}`.
   */
  skillArgs?: string[]
  delivery?: SkillDelivery
  /** Quanto esperar (ms) depois de iniciar a CLI antes de entregar a skill. */
  readyDelayMs?: number
  description?: string
  /** Comando sugerido para instalar, exibido quando o executável não é encontrado. */
  install?: string
}

export interface SkillInfo {
  id: string
  name: string
  description: string
  /** Caminho absoluto do arquivo .md. */
  path: string
}

export interface TerminalSpawnOptions {
  id?: string
  shell?: TerminalShell
  cwd?: string
  cols?: number
  rows?: number
  env?: Record<string, string>
  /** Opcional: inicia uma CLI de IA dentro do shell. */
  agentId?: string
  /** Opcional: carrega esta skill como contexto inicial do agente. */
  skillId?: string
}

export interface TerminalInfo {
  id: string
  shell: TerminalShell
  pid: number
  title: string
  cwd: string
  createdAt: number
  agentId?: string
  agentLabel?: string
  skillId?: string
  skillName?: string
}

export interface TerminalDataEvent {
  id: string
  data: string
}

export interface TerminalExitEvent {
  id: string
  exitCode: number
  signal?: number
}

export interface OrchestratorAPI {
  spawnTerminal: (options?: TerminalSpawnOptions) => Promise<TerminalInfo>
  writeTerminal: (id: string, data: string) => Promise<void>
  resizeTerminal: (id: string, cols: number, rows: number) => Promise<void>
  killTerminal: (id: string) => Promise<boolean>
  listTerminals: () => Promise<TerminalInfo[]>
  listSkills: () => Promise<SkillInfo[]>
  listAgents: () => Promise<AgentDefinition[]>
  /** Entrega um prompt ao agente de um terminal já em execução (roteamento do pipeline). */
  sendPrompt: (id: string, text: string) => Promise<boolean>
  /** Escreve um aviso na tela do terminal, sem passar pelo stdin do shell. */
  notifyTerminal: (id: string, text: string) => Promise<void>
  readDocument: (path: string) => Promise<DocumentInfo | null>
  createDocument: (name: string, content: string) => Promise<DocumentInfo | null>
  onTerminalData: (callback: (event: TerminalDataEvent) => void) => () => void
  onTerminalExit: (callback: (event: TerminalExitEvent) => void) => () => void
  onPipelineStatus: (callback: (event: PipelineStatusEvent) => void) => () => void
  onDocument: (callback: (event: DocumentEvent) => void) => () => void
}

/** Veredito que um agente grava no arquivo de status ao terminar seu turno. */
export type PipelineStatus = 'approved' | 'rejected'

/** Em qual veredito a aresta dispara. */
export type EdgeCondition = 'always' | 'approved' | 'rejected'

export interface PipelineStatusEvent {
  terminalId: string
  status: PipelineStatus
  reason?: string
  files?: string[]
}

export interface DocumentInfo {
  path: string
  name: string
  content: string
  truncated: boolean
}

export interface DocumentEvent extends DocumentInfo {
  /** 'disk' veio do observador de arquivos; 'agent' veio de um anúncio explícito. */
  origin: 'disk' | 'agent'
  /** Por que o agente abriu o documento, quando ele informa. */
  intent?: string
}

export interface DocumentNodeData extends Record<string, unknown> {
  path: string
  name: string
  content: string
  truncated: boolean
  intent?: string
  origin?: 'disk' | 'agent' | 'manual'
}

export interface GroupNodeData extends Record<string, unknown> {
  title: string
}

export interface TerminalNodeData extends Record<string, unknown> {
  id: string
  title: string
  shell: TerminalShell
  active: boolean
  pid?: number
  createdAt?: number
  cols?: number
  rows?: number
  agentLabel?: string
  skillName?: string
}
