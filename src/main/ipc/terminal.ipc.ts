import { ipcMain, BrowserWindow, clipboard } from 'electron'
import { ptyManager } from '../core/pty-manager'
import { listSkills } from '../core/skill-registry'
import { listAgents } from '../core/agent-registry'
import { pipelineWatcher } from '../core/pipeline-watcher'
import { documentWatcher, readDocument, writeDocument } from '../core/document-watcher'
import { traceWatcher } from '../core/trace-watcher'
import * as path from 'path'
import {
  TerminalSpawnOptions,
  TerminalInfo,
  TerminalDataEvent,
  TerminalExitEvent,
  TerminalActivityEvent,
  PipelineStatusEvent,
  AgentSpawnEvent,
  DocumentEvent,
  TraceEvent
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

  ipcMain.handle(
    'terminal:deliver-skill',
    async (_event, id: string, skillId?: string, task?: string) => {
      return ptyManager.deliverSkill(id, skillId, task)
    }
  )

  ipcMain.handle('terminal:inject-protocol', async (_event, id: string) => {
    return ptyManager.injectProtocol(id)
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

  // Grava o que foi digitado no nó de documento. Só vale para arquivos que o
  // watcher já conhece; o conteúdo volta pelo evento de disco, como qualquer
  // outra escrita.
  ipcMain.handle('doc:write', async (_event, filePath: string, content: string) => {
    return writeDocument(filePath, content)
  })

  // O colar do terminal passa por aqui, e não pelo Ctrl+V do Chromium: sem um
  // Menu registrado o atalho nativo não existe, e a tecla iria crua para o PTY
  // — onde uma CLI como o agy a interpreta como "colar imagem".
  ipcMain.handle('clipboard:read', async () => {
    return clipboard.readText()
  })

  ptyManager.onData((event: TerminalDataEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('terminal:data', event)
    }
  })

  ptyManager.onActivity((event: TerminalActivityEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('terminal:activity', event)
    }
  })

  ptyManager.onInfo((info: TerminalInfo) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('terminal:info', info)
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

  // Quem cria o nó e desenha a ligação é o renderer, dono do canvas.
  documentWatcher.on('spawn', (event: AgentSpawnEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('agent:spawn', event)
    }
  })

  documentWatcher.on('document', (event: DocumentEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('doc:changed', event)
    }
  })
  documentWatcher.start()

  traceWatcher.on('trace', (event: TraceEvent) => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('terminal:trace', event)
    }
  })
  traceWatcher.start()
}
