import { EventEmitter } from 'events'
import * as os from 'os'
import * as crypto from 'crypto'
import * as pty from 'node-pty'
import {
  TerminalInfo,
  TerminalSpawnOptions,
  TerminalDataEvent,
  TerminalExitEvent,
  TerminalShell
} from '@shared/types'

interface ActivePtySession {
  info: TerminalInfo
  ptyProcess: pty.IPty
}

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
      COLORTERM: 'truecolor'
    } as Record<string, string>

    const ptyProcess = pty.spawn(file, args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env,
      useConpty: isWin
    })

    const title = `${shell.toUpperCase()} #${id.slice(0, 4)}`

    const info: TerminalInfo = {
      id,
      shell,
      pid: ptyProcess.pid,
      title,
      cwd,
      createdAt: Date.now()
    }

    this.sessions.set(id, { info, ptyProcess })

    ptyProcess.onData((data: string) => {
      const event: TerminalDataEvent = { id, data }
      this.emit('data', event)
    })

    ptyProcess.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
      this.sessions.delete(id)
      const event: TerminalExitEvent = { id, exitCode, signal }
      this.emit('exit', event)
    })

    return info
  }

  public write(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (session) {
      session.ptyProcess.write(data)
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
      try {
        session.ptyProcess.kill()
      } catch (err) {
        console.warn(`[PtyManager] Error killing process ${id}:`, err)
      }
      this.sessions.delete(id)
      return true
    }
    return false
  }

  public list(): TerminalInfo[] {
    return Array.from(this.sessions.values()).map((s) => s.info)
  }

  public killAll(): void {
    for (const [id, session] of this.sessions) {
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
