import { useEffect, useMemo, useRef, type ReactElement } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  ConnectionLineType,
  useReactFlow
} from '@xyflow/react'
import { TerminalNode } from './TerminalNode'
import { TopBar } from './TopBar'
import { NewTerminalModal } from './NewTerminalModal'
import { ConditionEdge } from './ConditionEdge'
import { DocumentNode } from './DocumentNode'
import { GroupNode } from './GroupNode'
import { useTerminalStore, EDGE_DEFAULTS } from '../store/terminalStore'

export function SpatialCanvas(): ReactElement {
  const initializedRef = useRef(false)
  const { fitView } = useReactFlow()

  const nodes = useTerminalStore((s) => s.nodes)
  const edges = useTerminalStore((s) => s.edges)
  const onNodesChange = useTerminalStore((s) => s.onNodesChange)
  const onEdgesChange = useTerminalStore((s) => s.onEdgesChange)
  const onConnect = useTerminalStore((s) => s.onConnect)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const loadCatalog = useTerminalStore((s) => s.loadCatalog)
  const handlePipelineStatus = useTerminalStore((s) => s.handlePipelineStatus)
  const handleDocumentEvent = useTerminalStore((s) => s.handleDocumentEvent)
  const handleAgentSpawn = useTerminalStore((s) => s.handleAgentSpawn)
  const setTerminalActivity = useTerminalStore((s) => s.setTerminalActivity)

  const nodeTypes = useMemo(
    () => ({
      terminal: TerminalNode,
      document: DocumentNode,
      group: GroupNode
    }),
    []
  )

  const edgeTypes = useMemo(
    () => ({
      condition: ConditionEdge
    }),
    []
  )

  // Vereditos chegam do main; quem decide para onde encaminhar é o store,
  // que é o lado que conhece as arestas.
  useEffect(() => {
    if (!window.orchestrator) return
    return window.orchestrator.onPipelineStatus((event) => {
      handlePipelineStatus(event)
    })
  }, [handlePipelineStatus])

  useEffect(() => {
    if (!window.orchestrator) return
    return window.orchestrator.onDocument((event) => {
      handleDocumentEvent(event)
    })
  }, [handleDocumentEvent])

  // O estado do nó vem do fluxo de bytes do PTY, não de leitura de tela.
  useEffect(() => {
    if (!window.orchestrator) return
    return window.orchestrator.onTerminalActivity((event) => {
      setTerminalActivity(event.id, event.activity)
    })
  }, [setTerminalActivity])

  useEffect(() => {
    if (!window.orchestrator) return
    return window.orchestrator.onAgentSpawn((event) => {
      handleAgentSpawn(event)
    })
  }, [handleAgentSpawn])

  // Inicialização: carregar catálogo de skills/agentes e criar 1 terminal de boas-vindas
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    loadCatalog()

    if (nodes.length === 0) {
      // Terminal inicial sem agente: o usuário escolhe o contexto nos próximos.
      addTerminal({ shell: 'powershell', agentId: null, skillId: null }).then(() => {
        setTimeout(() => {
          fitView({ padding: 0.25, duration: 600 })
        }, 300)
      })
    }
  }, [addTerminal, fitView, loadCatalog, nodes.length])

  return (
    <div className="relative w-screen h-screen bg-[#0b1220] overflow-hidden select-none">
      <TopBar />
      <NewTerminalModal />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Loose: qualquer handle pode iniciar ou receber uma conexão, então dá
        // para ligar os nós por cima, por baixo ou pelos lados.
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#38bdf8', strokeWidth: 2 }}
        defaultEdgeOptions={EDGE_DEFAULTS}
        fitView
        minZoom={0.15}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        className="agent-orchestrator-canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#64748b"
          className="opacity-70"
        />

        <Controls
          position="bottom-left"
          className="!bg-slate-800/95 !border !border-slate-600 !rounded-xl !shadow-2xl !p-1 [&>button]:!bg-transparent [&>button]:!border-none [&>button]:!text-slate-200 hover:[&>button]:!text-white hover:[&>button]:!bg-slate-700 [&>button]:!rounded-lg transition-colors"
        />

        <MiniMap
          position="bottom-right"
          nodeColor="#38bdf8"
          nodeStrokeColor="#0ea5e9"
          nodeBorderRadius={6}
          maskColor="rgba(15, 23, 42, 0.75)"
          className="!bg-slate-800/95 !border !border-slate-600 !rounded-xl !shadow-2xl !overflow-hidden"
        />
      </ReactFlow>
    </div>
  )
}
