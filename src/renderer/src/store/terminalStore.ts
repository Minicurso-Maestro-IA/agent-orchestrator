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
  Connection,
  MarkerType
} from '@xyflow/react'
import {
  TerminalNodeData,
  TerminalShell,
  SkillInfo,
  AgentDefinition,
  EdgeCondition,
  PipelineStatusEvent,
  TerminalActivity,
  AgentSpawnEvent,
  DocumentNodeData,
  DocumentEvent,
  GroupNodeData
} from '@shared/types'

export const NODE_WIDTH = 640
export const NODE_HEIGHT = 400
export const DOC_WIDTH = 420
export const DOC_HEIGHT = 320

export type TerminalFlowNode = Node<TerminalNodeData, 'terminal'>
export type DocumentFlowNode = Node<DocumentNodeData, 'document'>
export type GroupFlowNode = Node<GroupNodeData, 'group'>
export type AppNode = TerminalFlowNode | DocumentFlowNode | GroupFlowNode

export const isTerminal = (n: AppNode): n is TerminalFlowNode => n.type === 'terminal'
export const isDocument = (n: AppNode): n is DocumentFlowNode => n.type === 'document'

export interface SpawnContext {
  shell?: TerminalShell
  agentId?: string | null
  skillId?: string | null
  position?: { x: number; y: number }
  /** Entregue junto do primeiro prompt, sem esperar a CLI subir. */
  task?: string
  /** Sobrescreve o título do nó. Usado quando um agente nomeia o que ele criou. */
  title?: string
  /** Id do terminal que pediu a criação, quando não foi o humano. */
  spawnedBy?: string
}

export const CONDITION_COLORS: Record<EdgeCondition, string> = {
  always: '#38bdf8',
  approved: '#34d399',
  rejected: '#fb7185'
}

export const CONDITION_LABELS: Record<EdgeCondition, string> = {
  always: 'sempre',
  approved: 'aprovado',
  rejected: 'reprovado'
}

/** Um ciclo reprovando → corrigindo → reprovando queima crédito de API sem parar. */
const MAX_HOPS = 20
/**
 * Teto de agentes criados por agentes. Um agente que se divide sem parar enche o
 * canvas e esvazia a cota antes de alguém perceber. O limite é da sessão: o
 * humano continua criando nós à mão sem restrição.
 */
const MAX_SPAWNS = 8

export function edgeVisuals(condition: EdgeCondition): Record<string, unknown> {
  const color = CONDITION_COLORS[condition]
  return {
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color }
  }
}

export const EDGE_DEFAULTS = {
  type: 'condition',
  animated: true,
  ...edgeVisuals('always')
}

function conditionOf(edge: Edge): EdgeCondition {
  const c = (edge.data as { condition?: EdgeCondition } | undefined)?.condition
  return c || 'always'
}

interface TerminalState {
  nodes: AppNode[]
  edges: Edge[]
  selectedShell: TerminalShell
  skills: SkillInfo[]
  agents: AgentDefinition[]
  selectedAgentId: string | null
  selectedSkillId: string | null
  newTerminalOpen: boolean
  setNewTerminalOpen: (open: boolean) => void
  pipelineHalted: boolean
  pipelineHops: number
  agentSpawns: number
  resumePipeline: () => void
  cycleEdgeCondition: (edgeId: string) => void
  handlePipelineStatus: (event: PipelineStatusEvent) => Promise<void>
  handleAgentSpawn: (event: AgentSpawnEvent) => Promise<void>
  setTerminalActivity: (id: string, activity: TerminalActivity) => void
  handleDocumentEvent: (event: DocumentEvent) => void
  createDocumentNode: (name: string) => Promise<void>
  createGroup: () => void
  renameGroup: (id: string, title: string) => void
  removeNode: (id: string) => void
  setSelectedShell: (shell: TerminalShell) => void
  setSelectedAgent: (id: string | null) => void
  setSelectedSkill: (id: string | null) => void
  loadCatalog: () => Promise<void>
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addTerminal: (ctx?: SpawnContext) => Promise<string | null>
  closeTerminal: (id: string) => Promise<void>
  setTerminalActive: (id: string, active: boolean) => void
  clearAllTerminals: () => Promise<void>
}

let terminalCounter = 1
let groupCounter = 1

function nextPosition(count: number): { x: number; y: number } {
  const perRow = 3
  const gap = 48
  return {
    x: 80 + (count % perRow) * (NODE_WIDTH + gap),
    y: 120 + Math.floor(count / perRow) * (NODE_HEIGHT + gap)
  }
}

function sizeOf(node: AppNode): { w: number; h: number } {
  const style = node.style as { width?: number; height?: number } | undefined
  if (node.type === 'document') return { w: style?.width ?? DOC_WIDTH, h: style?.height ?? DOC_HEIGHT }
  if (node.type === 'group') return { w: style?.width ?? 800, h: style?.height ?? 600 }
  return { w: style?.width ?? NODE_WIDTH, h: style?.height ?? NODE_HEIGHT }
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedShell: 'powershell',
  skills: [],
  agents: [],
  selectedAgentId: null,
  selectedSkillId: null,
  newTerminalOpen: false,
  pipelineHalted: false,
  pipelineHops: 0,
  agentSpawns: 0,

  setNewTerminalOpen: (open: boolean) => set({ newTerminalOpen: open }),
  resumePipeline: () => set({ pipelineHalted: false, pipelineHops: 0, agentSpawns: 0 }),
  setSelectedShell: (shell: TerminalShell) => set({ selectedShell: shell }),
  setSelectedAgent: (id: string | null) => set({ selectedAgentId: id }),
  setSelectedSkill: (id: string | null) => set({ selectedSkillId: id }),

  loadCatalog: async () => {
    if (typeof window === 'undefined' || !window.orchestrator) return
    try {
      const [skills, agents] = await Promise.all([
        window.orchestrator.listSkills(),
        window.orchestrator.listAgents()
      ])
      set({ skills, agents })
    } catch (err) {
      console.error('[TerminalStore] Failed to load skills/agents catalog:', err)
    }
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection: Connection) => {
    set({ edges: addEdge({ ...connection, ...EDGE_DEFAULTS }, get().edges) })

    // Ligar um documento a um terminal injeta o conteúdo como contexto do agente.
    const { nodes } = get()
    const source = nodes.find((n) => n.id === connection.source)
    const target = nodes.find((n) => n.id === connection.target)
    if (!source || !target || !isDocument(source) || !isTerminal(target)) return

    const api = window.orchestrator
    if (!api || !target.data.active) return

    const prompt = [
      `Contexto adicional do documento "${source.data.name}":`,
      '',
      source.data.content
    ].join('\n')

    api.sendPrompt(target.id, prompt).then((ok) => {
      api.notifyTerminal(
        target.id,
        ok
          ? `▸ Documento "${source.data.name}" carregado como contexto`
          : `▸ Falha ao carregar o documento "${source.data.name}"`
      )
    })
  },

  cycleEdgeCondition: (edgeId: string) => {
    const order: EdgeCondition[] = ['always', 'approved', 'rejected']
    set((state) => ({
      edges: state.edges.map((e) => {
        if (e.id !== edgeId) return e
        const next = order[(order.indexOf(conditionOf(e)) + 1) % order.length]
        return { ...e, data: { ...e.data, condition: next }, ...edgeVisuals(next) }
      })
    }))
  },

  handlePipelineStatus: async (event: PipelineStatusEvent) => {
    const api = typeof window !== 'undefined' ? window.orchestrator : undefined
    const { nodes, edges, pipelineHalted, pipelineHops } = get()

    const source = nodes.find((n) => n.id === event.terminalId)
    if (!source || !isTerminal(source)) return

    const verdict = event.status === 'approved' ? 'APROVADO' : 'REPROVADO'
    await api?.notifyTerminal(
      event.terminalId,
      `▸ ${verdict}${event.reason ? `: ${event.reason}` : ''}`
    )

    if (pipelineHalted) {
      await api?.notifyTerminal(event.terminalId, '▸ Pipeline pausado; roteamento ignorado.')
      return
    }

    const matching = edges.filter(
      (e) => e.source === event.terminalId && ['always', event.status].includes(conditionOf(e))
    )

    if (matching.length === 0) {
      await api?.notifyTerminal(event.terminalId, '▸ Fim do pipeline (nenhuma conexão para seguir).')
      return
    }

    if (pipelineHops + matching.length > MAX_HOPS) {
      set({ pipelineHalted: true })
      await api?.notifyTerminal(
        event.terminalId,
        `▸ Pipeline pausado: limite de ${MAX_HOPS} saltos atingido. Retome pela barra superior.`
      )
      return
    }

    for (const edge of matching) {
      const target = nodes.find((n) => n.id === edge.target)
      if (!target || !isTerminal(target)) continue

      if (!target.data.active) {
        await api?.notifyTerminal(
          event.terminalId,
          `▸ Destino "${target.data.title}" não está ativo; roteamento cancelado.`
        )
        continue
      }

      const prompt =
        event.status === 'rejected'
          ? [
              `O passo "${source.data.title}" REPROVOU o trabalho.`,
              event.reason ? `Motivo: ${event.reason}` : '',
              event.files?.length ? `Arquivos envolvidos: ${event.files.join(', ')}` : '',
              'Corrija o que foi apontado e, ao terminar, grave novamente seu arquivo de status.'
            ]
              .filter(Boolean)
              .join('\n')
          : [
              `O passo "${source.data.title}" foi APROVADO e passou o trabalho para você.`,
              event.reason ? `Resumo: ${event.reason}` : '',
              event.files?.length ? `Arquivos envolvidos: ${event.files.join(', ')}` : '',
              'Execute a sua parte e, ao terminar, grave seu arquivo de status.'
            ]
              .filter(Boolean)
              .join('\n')

      const delivered = await api?.sendPrompt(edge.target, prompt)
      if (delivered) {
        set((s) => ({ pipelineHops: s.pipelineHops + 1 }))
        await api?.notifyTerminal(
          edge.target,
          `▸ Recebido de "${source.data.title}" (${CONDITION_LABELS[conditionOf(edge)]})`
        )
      } else {
        await api?.notifyTerminal(
          event.terminalId,
          `▸ Falha ao entregar para "${target.data.title}".`
        )
      }
    }
  },

  /**
   * Um .md detectado ou anunciado vira nó. Se já existe nó para esse arquivo,
   * atualizamos o conteúdo em vez de empilhar duplicatas a cada salvamento.
   */
  handleDocumentEvent: (event: DocumentEvent) => {
    set((state) => {
      const existing = state.nodes.find((n) => isDocument(n) && n.data.path === event.path)

      if (existing) {
        return {
          nodes: state.nodes.map((n) =>
            isDocument(n) && n.id === existing.id
              ? ({
                  ...n,
                  data: {
                    ...n.data,
                    content: event.content,
                    truncated: event.truncated,
                    intent: event.intent ?? n.data.intent
                  }
                } as DocumentFlowNode)
              : n
          )
        }
      }

      // Só abrimos nó sozinho quando o agente anuncia. Um watcher criando nó a
      // cada .md salvo no projeto encheria o canvas de ruído.
      if (event.origin !== 'agent') return state

      const pos = nextPosition(state.nodes.length)
      const node: DocumentFlowNode = {
        id: `doc-${event.path}`,
        type: 'document',
        position: pos,
        dragHandle: '.document-drag-handle',
        style: { width: DOC_WIDTH, height: DOC_HEIGHT },
        data: {
          path: event.path,
          name: event.name,
          content: event.content,
          truncated: event.truncated,
          intent: event.intent,
          origin: event.origin
        }
      }
      return { nodes: [...state.nodes, node] }
    })
  },

  createDocumentNode: async (name: string) => {
    const api = typeof window !== 'undefined' ? window.orchestrator : undefined
    if (!api) return
    const doc = await api.createDocument(name, `# ${name}\n\n`)
    if (!doc) return

    set((state) => {
      if (state.nodes.some((n) => isDocument(n) && n.data.path === doc.path)) return state
      const node: DocumentFlowNode = {
        id: `doc-${doc.path}`,
        type: 'document',
        position: nextPosition(state.nodes.length),
        dragHandle: '.document-drag-handle',
        style: { width: DOC_WIDTH, height: DOC_HEIGHT },
        data: { ...doc, origin: 'manual' }
      }
      return { nodes: [...state.nodes, node] }
    })
  },

  /** Agrupa os nós selecionados (ou todos, se nada estiver selecionado). */
  createGroup: () => {
    set((state) => {
      const selected = state.nodes.filter((n) => n.selected && n.type !== 'group')
      const members = selected.length ? selected : state.nodes.filter((n) => n.type !== 'group')
      if (members.length === 0) return state

      const pad = 48
      const top = Math.min(...members.map((n) => n.position.y)) - pad
      const left = Math.min(...members.map((n) => n.position.x)) - pad
      const right = Math.max(...members.map((n) => n.position.x + sizeOf(n).w)) + pad
      const bottom = Math.max(...members.map((n) => n.position.y + sizeOf(n).h)) + pad

      const groupId = `group-${Date.now()}`
      const group: GroupFlowNode = {
        id: groupId,
        type: 'group',
        position: { x: left, y: top },
        dragHandle: '.group-drag-handle',
        style: { width: right - left, height: bottom - top },
        zIndex: -1,
        selectable: true,
        data: { title: `Grupo ${groupCounter++}` }
      }

      const memberIds = new Set(members.map((n) => n.id))
      const reparented: AppNode[] = state.nodes.map((n) =>
        memberIds.has(n.id)
          ? ({
              ...n,
              parentId: groupId,
              // Posição de filho é relativa ao pai no React Flow.
              position: { x: n.position.x - left, y: n.position.y - top },
              selected: false
            } as AppNode)
          : n
      )

      // O pai precisa vir antes dos filhos no array.
      return { nodes: [group, ...reparented] }
    })
  },

  renameGroup: (id: string, title: string) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.type === 'group' && n.id === id
          ? ({ ...n, data: { ...n.data, title } } as GroupFlowNode)
          : n
      )
    }))
  },

  /** Remove um nó do canvas. Desfazer um grupo devolve os filhos à posição absoluta. */
  removeNode: (id: string) => {
    set((state) => {
      const node = state.nodes.find((n) => n.id === id)
      if (!node) return state

      if (node.type === 'group') {
        const freed: AppNode[] = state.nodes
          .filter((n) => n.id !== id)
          .map((n) =>
            n.parentId === id
              ? ({
                  ...n,
                  parentId: undefined,
                  position: {
                    x: n.position.x + node.position.x,
                    y: n.position.y + node.position.y
                  }
                } as AppNode)
              : n
          )
        return { nodes: freed }
      }

      return {
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.source !== id && e.target !== id)
      }
    })
  },

  addTerminal: async (ctx: SpawnContext = {}) => {
    const state = get()
    const shell = ctx.shell || state.selectedShell
    const agentId = ctx.agentId === undefined ? state.selectedAgentId : ctx.agentId
    const skillId = ctx.skillId === undefined ? state.selectedSkillId : ctx.skillId
    const count = terminalCounter++

    const pos = ctx.position || nextPosition(state.nodes.length)

    try {
      let terminalInfo
      if (typeof window !== 'undefined' && window.orchestrator) {
        terminalInfo = await window.orchestrator.spawnTerminal({
          shell,
          agentId: agentId || undefined,
          skillId: skillId || undefined,
          task: ctx.task
        })
      } else {
        const agent = state.agents.find((a) => a.id === agentId)
        const skill = state.skills.find((s) => s.id === skillId)
        terminalInfo = {
          id: `term-${Date.now()}`,
          shell,
          pid: 1000 + count,
          title: `${agent?.label || shell.toUpperCase()} #${count}`,
          cwd: 'C:\\Workspace',
          createdAt: Date.now(),
          agentLabel: agent?.label,
          skillName: skill?.name
        }
      }

      const newNode: TerminalFlowNode = {
        id: terminalInfo.id,
        type: 'terminal',
        position: pos,
        dragHandle: '.terminal-drag-handle',
        style: { width: NODE_WIDTH, height: NODE_HEIGHT },
        data: {
          id: terminalInfo.id,
          title: ctx.title || terminalInfo.title,
          shell: terminalInfo.shell,
          active: true,
          pid: terminalInfo.pid,
          createdAt: terminalInfo.createdAt,
          agentLabel: terminalInfo.agentLabel,
          skillName: terminalInfo.skillName,
          agentId: agentId || undefined,
          skillId: skillId || undefined,
          activity: 'idle',
          spawnedBy: ctx.spawnedBy
        }
      }

      set((s) => ({ nodes: [...s.nodes, newNode] }))
      return terminalInfo.id
    } catch (err) {
      console.error('[TerminalStore] Failed to spawn terminal:', err)
      return null
    }
  },

  setTerminalActivity: (id: string, activity: TerminalActivity) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        isTerminal(node) && node.id === id
          ? ({
              ...node,
              data: {
                ...node.data,
                activity,
                // O PTY morrer é a única fonte confiável de "sessão encerrada".
                active: activity === 'stopped' ? false : node.data.active
              }
            } as TerminalFlowNode)
          : node
      )
    }))
  },

  /**
   * Um agente pediu outro agente. O nó nasce ao lado de quem pediu, ligado a ele,
   * e a tarefa viaja junto do primeiro prompt — não há "esperar a CLI subir para
   * então mandar o trabalho", que é onde esse tipo de integração costuma falhar.
   */
  handleAgentSpawn: async (event: AgentSpawnEvent) => {
    const api = typeof window !== 'undefined' ? window.orchestrator : undefined
    const { nodes, agents, agentSpawns } = get()

    const source = event.from ? nodes.find((n) => n.id === event.from) : undefined
    const parent = source && isTerminal(source) ? source : undefined

    if (agentSpawns >= MAX_SPAWNS) {
      if (parent) {
        await api?.notifyTerminal(
          parent.id,
          `▸ Pedido de agente recusado: limite de ${MAX_SPAWNS} agentes criados por agentes nesta sessão.`
        )
      }
      return
    }

    // Sem agente indicado, o filho herda a CLI do pai: quase sempre é o que se
    // quer, e evita criar um shell pelado quando o agente esquece o campo.
    const requested = event.agentId && agents.some((a) => a.id === event.agentId)
      ? event.agentId
      : parent?.data.agentId ?? get().selectedAgentId

    const position = parent
      ? { x: parent.position.x + NODE_WIDTH + 48, y: parent.position.y }
      : nextPosition(nodes.length)

    const id = await get().addTerminal({
      shell: parent?.data.shell,
      agentId: requested ?? null,
      skillId: event.skillId ?? null,
      position,
      task: event.task,
      title: event.name,
      spawnedBy: parent?.id
    })

    if (!id) {
      if (parent) await api?.notifyTerminal(parent.id, '▸ Falha ao criar o agente pedido.')
      return
    }

    set((s) => ({
      agentSpawns: s.agentSpawns + 1,
      edges: parent
        ? [...s.edges, { id: `e-${parent.id}-${id}`, source: parent.id, target: id, ...EDGE_DEFAULTS }]
        : s.edges
    }))

    if (parent) {
      await api?.notifyTerminal(
        parent.id,
        `▸ Agente "${event.name || id}" criado e ligado a você.`
      )
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
        isTerminal(node) && node.id === id
          ? ({ ...node, data: { ...node.data, active } } as TerminalFlowNode)
          : node
      )
    }))
  },

  clearAllTerminals: async () => {
    const currentNodes = get().nodes
    for (const node of currentNodes) {
      if (isTerminal(node) && typeof window !== 'undefined' && window.orchestrator) {
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
