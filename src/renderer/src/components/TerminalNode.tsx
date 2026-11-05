import { useEffect, useRef, memo, type ReactElement } from 'react'
import { Handle, Position, NodeProps, Node, NodeResizeControl, NodeResizer } from '@xyflow/react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { X, Sparkles, BookOpen } from 'lucide-react'
import { TerminalNodeData, TerminalDataEvent, TerminalExitEvent } from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

/**
 * Tema industrial do terminal: fundo grafite escuro #0B0D11 e cores funcionais
 * com contraste rigoroso.
 */
const TERMINAL_THEME = {
  background: '#0B0D11',
  foreground: '#E6E8EC',
  cursor: '#5B9BD5',
  cursorAccent: '#0B0D11',
  selectionBackground: 'rgba(91, 155, 213, 0.3)',
  black: '#171A20',
  red: '#D87979',
  green: '#62B58A',
  yellow: '#D6A45D',
  blue: '#5B9BD5',
  magenta: '#9B8BCB',
  cyan: '#79B8D8',
  white: '#E6E8EC',
  brightBlack: '#737B88',
  brightRed: '#E09292',
  brightGreen: '#7BC4A0',
  brightYellow: '#E0B579',
  brightBlue: '#79B0E0',
  brightMagenta: '#B2A5D8',
  brightCyan: '#92CCE8',
  brightWhite: '#FFFFFF'
}

/** Handles nos quatro lados: com ConnectionMode.Loose cada um envia e recebe. */
const HANDLE_SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left }
] as const

function TerminalNodeComponent({
  id,
  data,
  selected
}: NodeProps<Node<TerminalNodeData>>): ReactElement {
  const terminalContainerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  const closeTerminal = useTerminalStore((s) => s.closeTerminal)
  const setTerminalActive = useTerminalStore((s) => s.setTerminalActive)

  const isTitleSameAsShell =
    data.title && data.title.toLowerCase().trim() === data.shell.toLowerCase().trim()

  useEffect(() => {
    if (!terminalContainerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      lineHeight: 1.3,
      fontFamily: '"JetBrains Mono", Consolas, "Cascadia Code", monospace',
      allowTransparency: false,
      minimumContrastRatio: 4.5,
      theme: TERMINAL_THEME
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.attachCustomKeyEventHandler((event) => {
      // Permite que Ctrl + e Ctrl - passem para o SpatialCanvas realizar o zoom
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === '+' ||
          event.key === '=' ||
          event.key === '-' ||
          event.key === '_' ||
          event.code === 'Equal' ||
          event.code === 'Minus' ||
          event.code === 'NumpadAdd' ||
          event.code === 'NumpadSubtract')
      ) {
        return false
      }
      return true
    })

    term.open(terminalContainerRef.current)

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    const doFitAndResize = () => {
      try {
        fitAddon.fit()
        if (term.cols > 0 && term.rows > 0 && window.orchestrator) {
          window.orchestrator.resizeTerminal(data.id, term.cols, term.rows)
        }
      } catch {
        // Container pode estar oculto durante o ciclo de vida inicial
      }
    }

    requestAnimationFrame(doFitAndResize)
    const timeoutId = setTimeout(doFitAndResize, 150)

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(doFitAndResize)
    })
    resizeObserver.observe(terminalContainerRef.current)

    const onDataDisposable = term.onData((input) => {
      if (window.orchestrator) {
        window.orchestrator.writeTerminal(data.id, input)
      }
    })

    let removeDataListener: (() => void) | undefined
    let removeExitListener: (() => void) | undefined

    if (window.orchestrator) {
      removeDataListener = window.orchestrator.onTerminalData((event: TerminalDataEvent) => {
        if (event.id === data.id) {
          term.write(event.data)
        }
      })

      removeExitListener = window.orchestrator.onTerminalExit((event: TerminalExitEvent) => {
        if (event.id === data.id) {
          setTerminalActive(data.id, false)
          term.writeln(`\r\n\x1b[31m[Process terminated (Exit code: ${event.exitCode})]\x1b[0m`)
        }
      })
    } else {
      term.writeln('\x1b[33m[Mock Terminal - Running outside Electron environment]\x1b[0m')
      term.writeln(`Shell: ${data.shell} | Ready for commands.\r\n$ `)
    }

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      onDataDisposable.dispose()
      removeDataListener?.()
      removeExitListener?.()
      term.dispose()
    }
  }, [data.id, data.shell, setTerminalActive])

  return (
    <div
      className={`relative flex flex-col w-full h-full rounded bg-[#0B0D11] border transition-colors duration-140 overflow-hidden group shadow-md ${
        selected ? 'border-[#5B9BD5] ring-1 ring-[#5B9BD5]/40' : 'border-[#262B34] hover:border-[#303641]'
      }`}
    >
      <NodeResizer
        minWidth={360}
        minHeight={220}
        isVisible={selected}
        lineClassName="!border-[#5B9BD5]/60"
        handleClassName="!w-2 !h-2 !bg-[#5B9BD5] !border !border-[#0B0D11] !rounded-none"
      />

      <NodeResizeControl
        minWidth={360}
        minHeight={220}
        position="bottom-right"
        className="!bg-transparent !border-none !w-5 !h-5 !bottom-0 !right-0 flex items-center justify-center cursor-se-resize text-[#737B88] hover:text-[#E6E8EC] opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <div className="w-2 h-2 border-r border-b border-current" />
      </NodeResizeControl>

      {/* Handles de conexão */}
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={side.id}
          type="source"
          position={side.position}
          id={side.id}
          title="Conectar"
        />
      ))}

      {/* Cabeçalho do Terminal */}
      <div className="terminal-drag-handle h-8 px-2.5 bg-[#171A20] border-b border-[#262B34] flex items-center justify-between cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              data.active ? 'bg-[#62B58A]' : 'bg-[#737B88]'
            }`}
            title={data.active ? 'Sessão ativa' : 'Sessão encerrada'}
          />

          <span className="text-xs font-medium text-[#E6E8EC] truncate max-w-[160px]">
            {data.title || 'Terminal'}
          </span>

          {!isTitleSameAsShell && (
            <span className="text-[10px] font-mono uppercase px-1 py-0.5 rounded bg-[#14171D] border border-[#262B34] text-[#A0A6B2] leading-none flex-shrink-0">
              {data.shell}
            </span>
          )}

          {data.agentLabel && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#242933] text-[#9B8BCB] border border-[#303641] leading-none flex-shrink-0 truncate max-w-[120px]"
              title={`Agente: ${data.agentLabel}`}
            >
              <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{data.agentLabel}</span>
            </span>
          )}

          {data.skillName && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#1D2129] text-[#A0A6B2] border border-[#262B34] leading-none flex-shrink-0 truncate max-w-[120px]"
              title={`Skill: ${data.skillName}`}
            >
              <BookOpen className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{data.skillName}</span>
            </span>
          )}

          {data.pid && (
            <span className="text-[10px] text-[#737B88] font-mono hidden md:inline flex-shrink-0">
              pid:{data.pid}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={() => closeTerminal(id)}
            className="p-1 rounded text-[#737B88] hover:text-[#D87979] hover:bg-[#242933] transition-colors"
            title="Fechar Terminal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Área de execução do XTerm */}
      <div
        ref={terminalContainerRef}
        className="nodrag nowheel flex-1 w-full min-h-0 bg-[#0B0D11] p-2 overflow-hidden cursor-text"
      />
    </div>
  )
}

export const TerminalNode = memo(TerminalNodeComponent)
