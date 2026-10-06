import { useEffect, useRef, memo, type ReactElement } from 'react'
import {
  Handle,
  Position,
  NodeProps,
  Node,
  NodeResizeControl,
  NodeResizer
} from '@xyflow/react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal as TerminalIcon, X } from 'lucide-react'
import {
  TerminalNodeData,
  TerminalDataEvent,
  TerminalExitEvent
} from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

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

  useEffect(() => {
    if (!terminalContainerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      lineHeight: 1.2,
      fontFamily: 'Consolas, "Cascadia Code", "Fira Code", monospace',
      allowTransparency: true,
      theme: {
        background: '#090d16',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        cursorAccent: '#090d16',
        selectionBackground: 'rgba(56, 189, 248, 0.25)',
        black: '#090d16',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#38bdf8',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#eab308',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#ffffff'
      }
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
      })
      term.loadAddon(webglAddon)
    } catch {
      // Fallback gracioso caso WebGL não esteja disponível
    }

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

    // Fit inicial
    requestAnimationFrame(doFitAndResize)
    const timeoutId = setTimeout(doFitAndResize, 150)

    // Observador para mudanças no tamanho do nó
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(doFitAndResize)
    })
    resizeObserver.observe(terminalContainerRef.current)

    // Captura entrada do usuário no terminal
    const onDataDisposable = term.onData((input) => {
      if (window.orchestrator) {
        window.orchestrator.writeTerminal(data.id, input)
      }
    })

    // Listeners de saída do PTY
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
      // Mensagem no modo de preview do navegador puro
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

  const shellBadgeColors: Record<string, string> = {
    powershell: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    cmd: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    wsl: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
  }

  return (
    <div
      className={`relative flex flex-col w-full h-full rounded-xl bg-slate-950 border transition-shadow duration-200 shadow-xl overflow-hidden group ${
        selected
          ? 'border-sky-500 shadow-sky-950/40 shadow-2xl ring-1 ring-sky-500/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Node Resizer para controle completo de bordas */}
      <NodeResizer
        minWidth={360}
        minHeight={220}
        isVisible={selected}
        lineClassName="!border-sky-500/60"
        handleClassName="!w-3 !h-3 !bg-sky-500 !border-2 !border-slate-950 !rounded"
      />

      {/* NodeResizeControl no canto inferior direito */}
      <NodeResizeControl
        minWidth={360}
        minHeight={220}
        position="bottom-right"
        className="!bg-transparent !border-none !w-6 !h-6 !bottom-0 !right-0 flex items-center justify-center cursor-se-resize text-slate-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-current rounded-br-[2px]" />
      </NodeResizeControl>

      {/* Handles para conexões espaciais */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        title="Input Hook"
        className="!w-3.5 !h-3.5 !bg-sky-500 hover:!bg-sky-400 !border-2 !border-slate-950 !rounded-full transition-transform hover:scale-125 shadow-lg"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        title="Output Stream"
        className="!w-3.5 !h-3.5 !bg-emerald-500 hover:!bg-emerald-400 !border-2 !border-slate-950 !rounded-full transition-transform hover:scale-125 shadow-lg"
      />

      {/* Barra de Título (Alça de Arrasto) */}
      <div className="terminal-drag-handle flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-slate-800/80 cursor-grab active:cursor-grabbing select-none backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status Indicator */}
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors flex-shrink-0 ${
              data.active
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                : 'bg-slate-600'
            }`}
            title={data.active ? 'Sessão ativa' : 'Sessão encerrada'}
          />

          <TerminalIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />

          {/* Título */}
          <span className="text-xs font-semibold text-slate-200 truncate">
            {data.title || 'Terminal'}
          </span>

          {/* Shell Badge */}
          <span
            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border leading-none font-medium flex-shrink-0 ${
              shellBadgeColors[data.shell] || shellBadgeColors.powershell
            }`}
          >
            {data.shell}
          </span>

          {data.pid && (
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              PID:{data.pid}
            </span>
          )}
        </div>

        {/* Controles de Janela */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => closeTerminal(id)}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
            title="Fechar Terminal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contêiner XTerm com classes nodrag e nowheel */}
      <div
        ref={terminalContainerRef}
        className="nodrag nowheel flex-1 w-full min-h-0 bg-[#090d16] p-2 overflow-hidden cursor-text"
      />
    </div>
  )
}

export const TerminalNode = memo(TerminalNodeComponent)
