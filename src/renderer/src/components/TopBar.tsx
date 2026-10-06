import { useState, type ReactElement } from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  Plus,
  Focus,
  ChevronDown,
  Layers
} from 'lucide-react'
import { TerminalShell } from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

export function TopBar(): ReactElement {
  const { fitView } = useReactFlow()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedShell = useTerminalStore((s) => s.selectedShell)
  const setSelectedShell = useTerminalStore((s) => s.setSelectedShell)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const nodes = useTerminalStore((s) => s.nodes)

  const shellOptions: { id: TerminalShell; label: string; icon: string; desc: string }[] = [
    {
      id: 'powershell',
      label: 'PowerShell',
      icon: 'PS',
      desc: 'Shell padrão e scripts (.ps1)'
    },
    {
      id: 'cmd',
      label: 'Command Prompt',
      icon: 'CMD',
      desc: 'Prompt de comando clássico do Windows'
    },
    {
      id: 'wsl',
      label: 'WSL (Linux)',
      icon: 'WSL',
      desc: 'Subsistema Windows para Linux'
    }
  ]

  const handleSelectShell = (shell: TerminalShell) => {
    setSelectedShell(shell)
    setDropdownOpen(false)
  }

  const handleAddTerminal = () => {
    addTerminal(selectedShell)
  }

  const handleFitView = () => {
    fitView({ padding: 0.25, duration: 400 })
  }

  const activeCount = nodes.filter((n) => n.data.active).length

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between px-4 py-2.5 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl">
      {/* Brand & App Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Agent Orchestrator
            </h1>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60">
              FASE 1 MVP
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Workspace com Canvas Espacial 2D & Terminais Nativos
          </p>
        </div>
      </div>

      {/* Center status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs text-slate-300">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-400">Terminais Ativos:</span>
        <span className="font-mono font-bold text-slate-100">{activeCount}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Shell Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors shadow-sm"
          >
            <span className="font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded border border-slate-700 text-sky-400">
              {selectedShell.toUpperCase()}
            </span>
            <span className="capitalize">{selectedShell}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 p-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 backdrop-blur-lg"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Selecionar Shell
              </div>
              {shellOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectShell(opt.id)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                    selectedShell === opt.id
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-sky-400 mt-0.5">
                    {opt.icon}
                  </span>
                  <div>
                    <div className="text-xs font-medium">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New Terminal Button */}
        <button
          onClick={handleAddTerminal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl shadow-lg shadow-sky-500/25 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Terminal</span>
        </button>

        {/* Fit View Button */}
        <button
          onClick={handleFitView}
          title="Centralizar Visualização"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors shadow-sm"
        >
          <Focus className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Centralizar</span>
        </button>
      </div>
    </header>
  )
}
