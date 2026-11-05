import { type ReactElement, useRef, useEffect, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Plus, Focus, PauseCircle, FilePlus, Group } from 'lucide-react'
import { useTerminalStore } from '../store/terminalStore'

function IFlowLogo({ className = 'w-4 h-4' }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5.5 8v2a2 2 0 0 0 2 2h0.5"
        stroke="#00D2FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 5.5h-2a2 2 0 0 0-2 2v0.5"
        stroke="#00D2FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 16v-2a2 2 0 0 0-2-2h-0.5"
        stroke="#00D2FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 18.5h2a2 2 0 0 0 2-2v-0.5"
        stroke="#00D2FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="8"
        y="8"
        width="8"
        height="8"
        rx="2"
        fill="#0A192F"
        stroke="#00D2FF"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="1.5" fill="#00D2FF" />
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill="#00D2FF" />
      <rect x="16" y="3" width="5" height="5" rx="1.5" fill="#00D2FF" />
      <rect x="3" y="16" width="5" height="5" rx="1.5" fill="#00D2FF" />
      <rect x="16" y="16" width="5" height="5" rx="1.5" fill="#00D2FF" />
    </svg>
  )
}

export function TopBar(): ReactElement {
  const { fitView } = useReactFlow()

  const nodes = useTerminalStore((s) => s.nodes)
  const setNewTerminalOpen = useTerminalStore((s) => s.setNewTerminalOpen)
  const pipelineHalted = useTerminalStore((s) => s.pipelineHalted)
  const resumePipeline = useTerminalStore((s) => s.resumePipeline)
  const createDocumentNode = useTerminalStore((s) => s.createDocumentNode)
  const createGroup = useTerminalStore((s) => s.createGroup)

  const [docName, setDocName] = useState('')
  const [docOpen, setDocOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const isElectron =
    typeof window !== 'undefined' &&
    Boolean(window.orchestrator || (window as unknown as { electron?: unknown }).electron || /Electron/i.test(navigator.userAgent))
  const isWindows = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent || navigator.platform)
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent || navigator.platform)

  const activeCount = nodes.filter((n) => n.type === 'terminal' && n.data.active).length

  // Fechar popover ao clicar fora
  useEffect(() => {
    if (!docOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setDocOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [docOpen])

  return (
    <header
      className={`h-11 w-full flex-shrink-0 bg-[#14171D] border-b border-[#262B34] flex items-center justify-between gap-3 select-none z-30 app-drag ${
        isElectron && isMac ? 'pl-20 pr-3.5' : isElectron && isWindows ? 'pl-3.5 pr-[144px]' : 'px-3.5'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Esquerda: Identidade e Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-[#171A20] border border-[#262B34]">
            <IFlowLogo className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-[#E6E8EC]">
            iFlow
          </span>
          <span className="text-[10px] font-mono text-[#737B88] px-1.5 py-0.5 bg-[#171A20] border border-[#262B34] rounded leading-none">
            v1.1.0
          </span>
        </div>

        <div className="h-4 w-px bg-[#262B34] flex-shrink-0" />

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#737B88] flex-shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              activeCount > 0 ? 'bg-[#62B58A]' : 'bg-[#737B88]'
            }`}
          />
          <span className="text-[#737B88]">Terminais:</span>
          <span className="font-mono text-[#E6E8EC] font-medium">{activeCount}</span>
        </div>
      </div>

      {/* Centro: Alertas do Pipeline */}
      <div
        className="flex items-center gap-2 app-no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {pipelineHalted && (
          <div className="flex items-center gap-2 px-2.5 h-7 bg-[#242933] border border-[#D87979]/40 rounded text-xs text-[#D87979]">
            <PauseCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden md:inline">Pipeline pausado</span>
            <button
              onClick={resumePipeline}
              className="font-medium text-[#E6E8EC] hover:underline underline-offset-2 ml-1"
            >
              Retomar
            </button>
          </div>
        )}
      </div>

      {/* Direita: Ações com altura rigorosamente alinhada */}
      <div
        className="flex items-center gap-2 flex-shrink-0 app-no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Documento .md */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setDocOpen(!docOpen)}
            title="Novo documento .md"
            className="h-7 px-2.5 text-xs text-[#A0A6B2] hover:text-[#E6E8EC] bg-[#171A20] hover:bg-[#1D2129] border border-[#262B34] rounded inline-flex items-center gap-1.5 transition-colors duration-140"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#A0A6B2]" />
            <span className="hidden md:inline">Documento</span>
          </button>

          {docOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-[#171A20] border border-[#303641] rounded-md shadow-2xl z-50">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#737B88] mb-1.5">
                Nome do arquivo
              </label>
              <input
                autoFocus
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && docName.trim()) {
                    createDocumentNode(docName.trim())
                    setDocName('')
                    setDocOpen(false)
                  }
                  if (e.key === 'Escape') setDocOpen(false)
                }}
                placeholder="regras-do-projeto"
                className="w-full bg-[#0C0E12] text-xs text-[#E6E8EC] px-2.5 py-1.5 rounded border border-[#262B34] outline-none focus:border-[#5B9BD5] font-mono placeholder:text-[#737B88]"
              />
              <button
                onClick={() => {
                  if (!docName.trim()) return
                  createDocumentNode(docName.trim())
                  setDocName('')
                  setDocOpen(false)
                }}
                className="mt-2.5 w-full h-7 px-2.5 text-xs font-medium text-[#E6E8EC] bg-[#242933] hover:bg-[#303641] border border-[#303641] rounded inline-flex items-center justify-center transition-colors duration-140"
              >
                Criar .md
              </button>
            </div>
          )}
        </div>

        {/* Agrupar nós selecionados */}
        <button
          onClick={createGroup}
          title="Agrupar os nós selecionados sob um título"
          className="h-7 px-2.5 text-xs text-[#A0A6B2] hover:text-[#E6E8EC] bg-[#171A20] hover:bg-[#1D2129] border border-[#262B34] rounded inline-flex items-center gap-1.5 transition-colors duration-140"
        >
          <Group className="w-3.5 h-3.5 text-[#A0A6B2]" />
          <span className="hidden md:inline">Agrupar</span>
        </button>

        {/* Centralizar visualização */}
        <button
          onClick={() => fitView({ padding: 0.25, duration: 400 })}
          title="Centralizar visualização"
          className="h-7 px-2.5 text-xs text-[#A0A6B2] hover:text-[#E6E8EC] bg-[#171A20] hover:bg-[#1D2129] border border-[#262B34] rounded inline-flex items-center gap-1.5 transition-colors duration-140"
        >
          <Focus className="w-3.5 h-3.5 text-[#A0A6B2]" />
          <span className="hidden lg:inline text-[11px]">Centralizar</span>
        </button>

        {/* Ação Primária: Novo Terminal */}
        <button
          onClick={() => setNewTerminalOpen(true)}
          title="Escolher shell, IA e skill"
          className="h-7 px-3 text-xs font-medium text-white bg-[#5B9BD5] hover:bg-[#4E8BC4] rounded border border-[#6BAAE4]/30 shadow-sm inline-flex items-center gap-1.5 transition-colors duration-140"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Novo Terminal</span>
        </button>
      </div>
    </header>
  )
}
