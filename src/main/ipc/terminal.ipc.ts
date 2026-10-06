import { ipcMain, BrowserWindow } from 'electron'
import { ptyManager } from '../core/pty-manager'
import { TerminalSpawnOptions, TerminalDataEvent, TerminalExitEvent } from '@shared/types'

export function registerTerminalIpc(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('terminal:spawn', async (_event, options: TerminalSpawnOptions) => {
    return ptyManager.spawn(options)
  })

  ipcMain.handle('terminal:write', async (_event, id: string, data: string) => {
    ptyManager.write(id, data)
  })

  ipcMain.handle('terminal:resize', async (_event, id: string, cols: number, rows: number) => {
    ptyManager.resize(id, cols, rows)
  })

  ipcMain.handle('terminal:kill', async (_event, id: string) => {
    return ptyManager.kill(id)
  })

  ipcMain.handle('terminal:list', async () => {
    return ptyManager.list()
  })

  ptyManager.onData((event: TerminalDataEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('terminal:data', event)
    }
  })

  ptyManager.onExit((event: TerminalExitEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('terminal:exit', event)
    }
  })
}
