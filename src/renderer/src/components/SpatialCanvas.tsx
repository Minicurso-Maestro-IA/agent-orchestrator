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
    <div className="flex flex-col w-screen h-screen bg-[#0C0E12] overflow-hidden select-none">
      <TopBar />
      <NewTerminalModal />

      <div className="flex-1 w-full h-full relative min-h-0">
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
          connectionLineStyle={{ stroke: '#5B9BD5', strokeWidth: 1.5 }}
          defaultEdgeOptions={EDGE_DEFAULTS}
          fitView
          minZoom={0.15}
          maxZoom={2.5}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
          className="iflow-canvas"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#222732"
            className="opacity-80"
          />

          <Controls
            position="bottom-left"
            showInteractive={false}
            className="!bg-[#171A20] !border !border-[#262B34] !rounded-md !p-0.5 !shadow-md [&>button]:!bg-transparent [&>button]:!border-none [&>button]:!text-[#A0A6B2] hover:[&>button]:!text-[#E6E8EC] hover:[&>button]:!bg-[#242933] [&>button]:!rounded [&>button]:!w-6 [&>button]:!h-6 transition-colors"
          />

          <MiniMap
            position="bottom-right"
            nodeColor={(n) => {
              if (n.type === 'document') return '#D6A45D'
              if (n.type === 'group') return '#1D2129'
              return '#303641'
            }}
            nodeStrokeColor={(n) => {
              if (n.type === 'document') return '#D6A45D'
              return '#5B9BD5'
            }}
            nodeBorderRadius={2}
            maskColor="rgba(12, 14, 18, 0.75)"
            className="!bg-[#14171D] !border !border-[#262B34] !rounded-md !shadow-md !overflow-hidden !w-36 !h-24"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
