import { useEffect, useRef, memo, type ReactElement } from 'react'
import { Handle, Position, NodeProps, Node, NodeResizeControl, NodeResizer } from '@xyflow/react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal as TerminalIcon, X, Sparkles, BookOpen } from 'lucide-react'
import { TerminalNodeData, TerminalDataEvent, TerminalExitEvent } from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

/**
 * Tema do terminal. Mais claro e com contraste maior que o original: o fundo
 * antigo (#090d16) era quase igual ao do canvas e os nós sumiam.
 */
const TERMINAL_THEME = {
  background: '#131c2e',
  foreground: '#e9eef8',
  cursor: '#38bdf8',
  cursorAccent: '#131c2e',
  selectionBackground: 'rgba(56, 189, 248, 0.35)',
  black: '#1e293b',
  red: '#fb7185',
  green: '#4ade80',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: '#c084fc',
  cyan: '#22d3ee',
  white: '#f1f5f9',
  brightBlack: '#64748b',
  brightRed: '#fda4af',
  brightGreen: '#86efac',
  brightYellow: '#fcd34d',
  brightBlue: '#93c5fd',
  brightMagenta: '#d8b4fe',
  brightCyan: '#67e8f9',
  brightWhite: '#ffffff'
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


  useEffect(() => {
    if (!terminalContainerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      lineHeight: 1.25,
      fontFamily: 'Consolas, "Cascadia Code", "Fira Code", monospace',
      allowTransparency: false,
      // Garante legibilidade mesmo quando um programa escolhe cores de baixo contraste.
      minimumContrastRatio: 4.5,
      theme: TERMINAL_THEME
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    // Sem WebGL de propósito: o canvas tem resolução fixa e o React Flow apenas
    // escala o raster, então o texto borrava ao dar zoom. O renderer DOM é
    // re-rasterizado pelo navegador em cada nível de zoom e fica nítido.
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
    powershell: 'bg-blue-500/15 text-blue-300 border-blue-400/40',
    cmd: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
    wsl: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
  }

  return (
    <div
      className={`relative flex flex-col w-full h-full rounded-xl bg-slate-900 border-2 transition-shadow duration-200 shadow-2xl overflow-hidden group ${
        selected
          ? 'border-sky-400 ring-2 ring-sky-400/40'
          : 'border-slate-600 hover:border-slate-500'
      }`}
    >
      <NodeResizer
        minWidth={360}
        minHeight={220}
        isVisible={selected}
        lineClassName="!border-sky-400/70"
        handleClassName="!w-3 !h-3 !bg-sky-400 !border-2 !border-slate-900 !rounded"
      />

      <NodeResizeControl
        minWidth={360}
        minHeight={220}
        position="bottom-right"
        className="!bg-transparent !border-none !w-6 !h-6 !bottom-0 !right-0 flex items-center justify-center cursor-se-resize text-slate-400 hover:text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-current rounded-br-[2px]" />
      </NodeResizeControl>

      {/* Conexões saem e entram por qualquer um dos quatro lados */}
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={side.id}
          type="source"
          position={side.position}
          id={side.id}
          title="Arraste para conectar"
          className="!w-3.5 !h-3.5 !bg-sky-400 hover:!bg-sky-300 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 shadow-lg"
        />
      ))}

      {/* Barra de Título (Alça de Arrasto) */}
      <div className="terminal-drag-handle flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-600 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors flex-shrink-0 ${
              data.active
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                : 'bg-slate-500'
            }`}
            title={data.active ? 'Sessão ativa' : 'Sessão encerrada'}
          />

          <TerminalIcon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />

          <span className="text-xs font-semibold text-slate-50 truncate">
            {data.title || 'Terminal'}
          </span>

          <span
            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border leading-none font-medium flex-shrink-0 ${
              shellBadgeColors[data.shell] || shellBadgeColors.powershell
            }`}
          >
            {data.shell}
          </span>

          {data.agentLabel && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border leading-none font-medium flex-shrink-0 bg-violet-500/15 text-violet-200 border-violet-400/40"
              title={`Agente: ${data.agentLabel}`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {data.agentLabel}
            </span>
          )}

          {data.skillName && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border leading-none font-medium flex-shrink-0 bg-sky-500/15 text-sky-200 border-sky-400/40 truncate max-w-[160px]"
              title={`Skill: ${data.skillName}`}
            >
              <BookOpen className="w-2.5 h-2.5 flex-shrink-0" />
              {data.skillName}
            </span>
          )}

          {data.pid && (
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              PID:{data.pid}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => closeTerminal(id)}
            className="p-1 rounded text-slate-300 hover:text-red-300 hover:bg-red-500/20 transition-colors"
            title="Fechar Terminal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={terminalContainerRef}
        className="nodrag nowheel flex-1 w-full min-h-0 bg-[#131c2e] p-2 overflow-hidden cursor-text"
      />
    </div>
  )
}

export const TerminalNode = memo(TerminalNodeComponent)
