export type TerminalShell = 'powershell' | 'cmd' | 'wsl'

export interface TerminalSpawnOptions {
  id?: string
  shell?: TerminalShell
  cwd?: string
  cols?: number
  rows?: number
  env?: Record<string, string>
}

export interface TerminalInfo {
  id: string
  shell: TerminalShell
  pid: number
  title: string
  cwd: string
  createdAt: number
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
  onTerminalData: (callback: (event: TerminalDataEvent) => void) => () => void
  onTerminalExit: (callback: (event: TerminalExitEvent) => void) => () => void
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
}
