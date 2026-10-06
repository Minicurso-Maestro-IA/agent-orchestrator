import { useEffect, useMemo, useRef, type ReactElement } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow
} from '@xyflow/react'
import { TerminalNode } from './TerminalNode'
import { TopBar } from './TopBar'
import { useTerminalStore } from '../store/terminalStore'

export function SpatialCanvas(): ReactElement {
  const initializedRef = useRef(false)
  const { fitView } = useReactFlow()

  const nodes = useTerminalStore((s) => s.nodes)
  const edges = useTerminalStore((s) => s.edges)
  const onNodesChange = useTerminalStore((s) => s.onNodesChange)
  const onEdgesChange = useTerminalStore((s) => s.onEdgesChange)
  const onConnect = useTerminalStore((s) => s.onConnect)
  const addTerminal = useTerminalStore((s) => s.addTerminal)

  const nodeTypes = useMemo(
    () => ({
      terminal: TerminalNode
    }),
    []
  )

  // Inicialização: criar automaticamente 1 terminal PowerShell de boas-vindas
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (nodes.length === 0) {
      addTerminal('powershell', { x: 260, y: 140 }).then(() => {
        // Ajusta a visualização após criar o nó inicial
        setTimeout(() => {
          fitView({ padding: 0.25, duration: 600 })
        }, 300)
      })
    }
  }, [addTerminal, fitView, nodes.length])

  return (
    <div className="relative w-screen h-screen bg-[#060911] overflow-hidden select-none">
      {/* Barra de Ferramentas Superior */}
      <TopBar />

      {/* Canvas Espacial 2D Infinito */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        className="agent-orchestrator-canvas"
      >
        {/* Fundo Pontilhado Escuro */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#334155"
          className="opacity-50"
        />

        {/* Controles de Zoom e Panning */}
        <Controls
          position="bottom-left"
          className="!bg-slate-900/90 !border !border-slate-800 !rounded-xl !shadow-2xl !p-1 [&>button]:!bg-transparent [&>button]:!border-none [&>button]:!text-slate-300 hover:[&>button]:!text-white hover:[&>button]:!bg-slate-800 [&>button]:!rounded-lg transition-colors"
        />

        {/* MiniMap Espacial */}
        <MiniMap
          position="bottom-right"
          nodeColor="#38bdf8"
          nodeStrokeColor="#0284c7"
          nodeBorderRadius={6}
          maskColor="rgba(9, 13, 22, 0.85)"
          className="!bg-slate-900/90 !border !border-slate-800 !rounded-xl !shadow-2xl !overflow-hidden backdrop-blur-md"
        />
      </ReactFlow>
    </div>
  )
}
