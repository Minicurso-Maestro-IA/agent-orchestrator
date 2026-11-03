import { contextBridge, ipcRenderer } from 'electron'
import {
  OrchestratorAPI,
  TerminalSpawnOptions,
  TerminalInfo,
  TerminalDataEvent,
  TerminalExitEvent,
  TerminalActivityEvent,
  AgentSpawnEvent,
  TraceEvent,
  SkillInfo,
  AgentDefinition,
  PipelineStatusEvent,
  DocumentInfo,
  DocumentEvent
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
  listSkills: (): Promise<SkillInfo[]> => {
    return ipcRenderer.invoke('context:skills')
  },
  listAgents: (): Promise<AgentDefinition[]> => {
    return ipcRenderer.invoke('context:agents')
  },
  sendPrompt: (id: string, text: string): Promise<boolean> => {
    return ipcRenderer.invoke('terminal:prompt', id, text)
  },
  notifyTerminal: (id: string, text: string): Promise<void> => {
    return ipcRenderer.invoke('terminal:notify', id, text)
  },
  readDocument: (filePath: string): Promise<DocumentInfo | null> => {
    return ipcRenderer.invoke('doc:read', filePath)
  },
  createDocument: (name: string, content: string): Promise<DocumentInfo | null> => {
    return ipcRenderer.invoke('doc:create', name, content)
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
  },
  onTerminalActivity: (callback: (event: TerminalActivityEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: TerminalActivityEvent): void => {
      callback(data)
    }
    ipcRenderer.on('terminal:activity', listener)
    return () => {
      ipcRenderer.removeListener('terminal:activity', listener)
    }
  },
  onTrace: (callback: (event: TraceEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: TraceEvent): void => {
      callback(data)
    }
    ipcRenderer.on('terminal:trace', listener)
    return () => {
      ipcRenderer.removeListener('terminal:trace', listener)
    }
  },
  onAgentSpawn: (callback: (event: AgentSpawnEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: AgentSpawnEvent): void => {
      callback(data)
    }
    ipcRenderer.on('agent:spawn', listener)
    return () => {
      ipcRenderer.removeListener('agent:spawn', listener)
    }
  },
  onPipelineStatus: (callback: (event: PipelineStatusEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: PipelineStatusEvent): void => {
      callback(data)
    }
    ipcRenderer.on('pipeline:status', listener)
    return () => {
      ipcRenderer.removeListener('pipeline:status', listener)
    }
  },
  onDocument: (callback: (event: DocumentEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: DocumentEvent): void => {
      callback(data)
    }
    ipcRenderer.on('doc:changed', listener)
    return () => {
      ipcRenderer.removeListener('doc:changed', listener)
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
