import { useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  ConnectionLineType,
  useReactFlow,
  type Edge,
  type IsValidConnection,
  type OnBeforeDelete,
  type OnNodesDelete
} from '@xyflow/react'
import { TerminalNode } from './TerminalNode'
import { TopBar } from './TopBar'
import { NewTerminalModal } from './NewTerminalModal'
import { StartTaskModal } from './StartTaskModal'
import { ConditionEdge } from './ConditionEdge'
import { DocumentNode } from './DocumentNode'
import { GroupNode } from './GroupNode'
import { useTerminalStore, EDGE_DEFAULTS, type AppNode } from '../store/terminalStore'
import { confirmarEncerrarOcupados, terminaisOcupados } from '../lib/confirmar'

export function SpatialCanvas(): ReactElement {
  const initializedRef = useRef(false)
  const { zoomIn, zoomOut } = useReactFlow()

  const nodes = useTerminalStore((s) => s.nodes)
  const edges = useTerminalStore((s) => s.edges)
  const onNodesChange = useTerminalStore((s) => s.onNodesChange)
  const onEdgesChange = useTerminalStore((s) => s.onEdgesChange)
  const onConnect = useTerminalStore((s) => s.onConnect)
  const loadCatalog = useTerminalStore((s) => s.loadCatalog)
  const handlePipelineStatus = useTerminalStore((s) => s.handlePipelineStatus)
  const setTerminalActivity = useTerminalStore((st) => st.setTerminalActivity)
  const handleAgentSpawn = useTerminalStore((st) => st.handleAgentSpawn)
  const handleTrace = useTerminalStore((st) => st.handleTrace)
  const aplicarInfo = useTerminalStore((st) => st.applyTerminalInfo)
  const handleDocumentEvent = useTerminalStore((s) => s.handleDocumentEvent)
  const removeNode = useTerminalStore((s) => s.removeNode)

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

  // Uma CLI reconhecida pelo que foi digitado muda o TerminalInfo depois de
  // criado; sem ouvir isto, a tela continua achando que o nó é um shell pelado.
  useEffect(() => {
    if (!window.orchestrator) return
    return window.orchestrator.onTerminalInfo((info) => {
      aplicarInfo(info)
    })
  }, [aplicarInfo])

  useEffect(() => {
    if (!window.orchestrator) return
    return window.orchestrator.onAgentSpawn((event) => {
      handleAgentSpawn(event)
    })
  }, [handleAgentSpawn])

  // Cada ferramenta que o agente usa vira uma linha no nó.
  useEffect(() => {
    if (!window.orchestrator) return
    return window.orchestrator.onTrace((event) => {
      handleTrace(event)
    })
  }, [handleTrace])

  // Atalhos de teclado: Ctrl + (zoom in) e Ctrl - (zoom out)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return

      // Zoom In: Ctrl + Plus, Ctrl + '=', NumpadAdd
      if (
        event.key === '+' ||
        event.key === '=' ||
        event.code === 'Equal' ||
        event.code === 'NumpadAdd'
      ) {
        event.preventDefault()
        zoomIn({ duration: 200 })
        return
      }

      // Zoom Out: Ctrl + Minus, Ctrl + '_', NumpadSubtract
      if (
        event.key === '-' ||
        event.key === '_' ||
        event.code === 'Minus' ||
        event.code === 'NumpadSubtract'
      ) {
        event.preventDefault()
        zoomOut({ duration: 200 })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [zoomIn, zoomOut])

  // Inicialização: carregar catálogo de skills/agentes e criar 1 terminal de boas-vindas
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // O canvas abre vazio. O terminal de boas-vindas existia para a tela não
    // nascer em branco, mas atrapalha quem vai montar um pipeline: era sempre
    // um nó a mais para apagar antes de começar.
    loadCatalog()
  }, [loadCatalog])

  // Apagar um grupo pelo teclado tem de devolver os filhos, igual ao × do
  // cabeçalho — e não levar junto os terminais que estão dentro dele, que é o
  // que o React Flow faria sozinho.
  const onBeforeDelete = useCallback<OnBeforeDelete<AppNode, Edge>>(
    async ({ nodes: aApagar, edges: arestas }) => {
      const grupos = aApagar.filter((n) => n.type === 'group')
      const idsDeGrupo = new Set(grupos.map((g) => g.id))

      const sobram = aApagar.filter(
        (n) => n.type !== 'group' && !(n.parentId && idsDeGrupo.has(n.parentId))
      )

      // Um agente trabalhando morre com o processo, e o canvas não desfaz.
      if (!confirmarEncerrarOcupados(terminaisOcupados(sobram))) return false

      if (grupos.length === 0) return { nodes: aApagar, edges: arestas }

      grupos.forEach((g) => removeNode(g.id))
      return { nodes: sobram, edges: arestas }
    },
    [removeNode]
  )

  // O nó sai da tela pelo React Flow; o processo por trás dele é nosso.
  const onNodesDelete = useCallback<OnNodesDelete<AppNode>>((apagados) => {
    apagados.forEach((node) => {
      if (node.type !== 'terminal' || !window.orchestrator) return
      window.orchestrator.killTerminal(node.id).catch((err) => {
        console.warn(`[SpatialCanvas] Erro ao encerrar o terminal ${node.id}:`, err)
      })
    })
  }, [])

  // Um nó ligado a si mesmo roteia o próprio veredito de volta para ele:
  // o pipeline gira sozinho até o limite de saltos, sem ninguém revisar nada.
  const isValidConnection = useCallback<IsValidConnection<Edge>>(
    (conexao) => conexao.source !== conexao.target,
    []
  )

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0C0E12] overflow-hidden select-none">
      <TopBar />
      <NewTerminalModal />
      <StartTaskModal />

      <div className="flex-1 w-full h-full relative min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onBeforeDelete={onBeforeDelete}
          onNodesDelete={onNodesDelete}
          isValidConnection={isValidConnection}
          // O padrão do React Flow é só Backspace, que ninguém tenta. Teclas em
          // campo de texto são ignoradas pela própria biblioteca, então digitar
          // no terminal não apaga nó nenhum.
          deleteKeyCode={['Delete', 'Backspace']}
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
