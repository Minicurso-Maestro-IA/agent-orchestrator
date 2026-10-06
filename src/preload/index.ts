import { contextBridge, ipcRenderer } from 'electron'
import {
  OrchestratorAPI,
  TerminalSpawnOptions,
  TerminalInfo,
  TerminalDataEvent,
  TerminalExitEvent
} from '@shared/types'

const orchestratorAPI: OrchestratorAPI = {
  spawnTerminal: (options?: TerminalSpawnOptions): Promise<TerminalInfo> => {
    return ipcRenderer.invoke('terminal:spawn', options)
  },
  writeTerminal: (id: string, data: string): Promise<void> => {
    return ipcRenderer.invoke('terminal:write', id, data)
  },
  resizeTerminal: (id: string, cols: number, rows: number): Promise<void> => {
    return ipcRenderer.invoke('terminal:resize', id, cols, rows)
  },
  killTerminal: (id: string): Promise<boolean> => {
    return ipcRenderer.invoke('terminal:kill', id)
  },
  listTerminals: (): Promise<TerminalInfo[]> => {
    return ipcRenderer.invoke('terminal:list')
  },
  onTerminalData: (callback: (event: TerminalDataEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: TerminalDataEvent): void => {
      callback(data)
    }
    ipcRenderer.on('terminal:data', listener)
    return () => {
      ipcRenderer.removeListener('terminal:data', listener)
    }
  },
  onTerminalExit: (callback: (event: TerminalExitEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: TerminalExitEvent): void => {
      callback(data)
    }
    ipcRenderer.on('terminal:exit', listener)
    return () => {
      ipcRenderer.removeListener('terminal:exit', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('orchestrator', orchestratorAPI)
  } catch (error) {
    console.error('Failed to expose orchestrator API:', error)
  }
} else {
  // @ts-ignore fallback
  window.orchestrator = orchestratorAPI
}
