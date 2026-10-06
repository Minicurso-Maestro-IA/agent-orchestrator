import { create } from 'zustand'
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  addEdge,
  Connection
} from '@xyflow/react'
import { TerminalNodeData, TerminalShell } from '@shared/types'

interface TerminalState {
  nodes: Node<TerminalNodeData>[]
  edges: Edge[]
  selectedShell: TerminalShell
  setSelectedShell: (shell: TerminalShell) => void
  onNodesChange: OnNodesChange<Node<TerminalNodeData>>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addTerminal: (shell?: TerminalShell, position?: { x: number; y: number }) => Promise<string | null>
  closeTerminal: (id: string) => Promise<void>
  setTerminalActive: (id: string, active: boolean) => void
  clearAllTerminals: () => Promise<void>
}

let terminalCounter = 1

export const useTerminalStore = create<TerminalState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedShell: 'powershell',

  setSelectedShell: (shell: TerminalShell) => set({ selectedShell: shell }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    })
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#38bdf8', strokeWidth: 2 }
        },
        get().edges
      )
    })
  },

  addTerminal: async (shellArg?: TerminalShell, positionArg?: { x: number; y: number }) => {
    const shell = shellArg || get().selectedShell
    const count = terminalCounter++

    // Determine initial position
    let pos = positionArg
    if (!pos) {
      const existing = get().nodes
      const offset = (existing.length % 5) * 40
      pos = { x: 200 + offset, y: 120 + offset }
    }

    try {
      let terminalInfo
      if (typeof window !== 'undefined' && window.orchestrator) {
        terminalInfo = await window.orchestrator.spawnTerminal({ shell })
      } else {
        // Fallback for browser-only dev preview
        terminalInfo = {
          id: `term-${Date.now()}`,
          shell,
          pid: 1000 + count,
          title: `${shell.toUpperCase()} #${count}`,
          cwd: 'C:\\Workspace',
          createdAt: Date.now()
        }
      }

      const newNode: Node<TerminalNodeData> = {
        id: terminalInfo.id,
        type: 'terminal',
        position: pos,
        dragHandle: '.terminal-drag-handle',
        style: {
          width: 640,
          height: 400
        },
        data: {
          id: terminalInfo.id,
          title: terminalInfo.title,
          shell: terminalInfo.shell,
          active: true,
          pid: terminalInfo.pid,
          createdAt: terminalInfo.createdAt
        }
      }

      set((state) => ({
        nodes: [...state.nodes, newNode]
      }))

      return terminalInfo.id
    } catch (err) {
      console.error('[TerminalStore] Failed to spawn terminal:', err)
      return null
    }
  },

  closeTerminal: async (id: string) => {
    if (typeof window !== 'undefined' && window.orchestrator) {
      try {
        await window.orchestrator.killTerminal(id)
      } catch (err) {
        console.warn(`[TerminalStore] Error killing terminal ${id}:`, err)
      }
    }

    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id)
    }))
  },

  setTerminalActive: (id: string, active: boolean) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, active } } : node
      )
    }))
  },

  clearAllTerminals: async () => {
    const currentNodes = get().nodes
    for (const node of currentNodes) {
      if (typeof window !== 'undefined' && window.orchestrator) {
        try {
          await window.orchestrator.killTerminal(node.id)
        } catch {
          // ignore
        }
      }
    }
    set({ nodes: [], edges: [] })
  }
}))
