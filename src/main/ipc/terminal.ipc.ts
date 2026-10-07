import { ipcMain, BrowserWindow } from 'electron'
import { ptyManager } from '../core/pty-manager'
import { listSkills } from '../core/skill-registry'
import { listAgents } from '../core/agent-registry'
import { pipelineWatcher } from '../core/pipeline-watcher'
import { documentWatcher, readDocument, writeDocument } from '../core/document-watcher'
import * as path from 'path'
import {
  TerminalSpawnOptions,
  TerminalDataEvent,
  TerminalExitEvent,
  PipelineStatusEvent,
  DocumentEvent
} from '@shared/types'

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

  ipcMain.handle('context:skills', async () => {
    return listSkills()
  })

  ipcMain.handle('context:agents', async () => {
    return listAgents()
  })

  ipcMain.handle('terminal:prompt', async (_event, id: string, text: string) => {
    return ptyManager.sendPrompt(id, text)
  })

  ipcMain.handle('terminal:notify', async (_event, id: string, text: string) => {
    ptyManager.notify(id, text)
  })

  ipcMain.handle('doc:read', async (_event, filePath: string) => {
    return readDocument(filePath)
  })

  ipcMain.handle('doc:create', async (_event, name: string, content: string) => {
    const safe = name.replace(/[\/:*?"<>|]/g, '-').trim() || 'novo-documento'
    const file = path.join(documentWatcher.rootDir, safe.endsWith('.md') ? safe : `${safe}.md`)
    if (!writeDocument(file, content)) return null
    return readDocument(file)
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

  // O roteamento em si mora no renderer, que é quem conhece as arestas.
  pipelineWatcher.on('status', (event: PipelineStatusEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('pipeline:status', event)
    }
  })
  pipelineWatcher.start()

  documentWatcher.on('document', (event: DocumentEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('doc:changed', event)
    }
  })
  documentWatcher.start()
}
