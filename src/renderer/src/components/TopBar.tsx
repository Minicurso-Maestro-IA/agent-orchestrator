import { type ReactElement } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useState } from 'react'
import { Plus, Focus, Layers, PauseCircle, FilePlus, Group } from 'lucide-react'
import { useTerminalStore } from '../store/terminalStore'

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

  const activeCount = nodes.filter((n) => n.type === 'terminal' && n.data.active).length

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/30 flex-shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white truncate">
              Agent Orchestrator
            </h1>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/50 flex-shrink-0">
              FASE 1 MVP
            </span>
          </div>
          <p className="text-[11px] text-slate-300 truncate">
            Workspace com Canvas Espacial 2D & Terminais Nativos
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/70 rounded-xl border border-slate-600 text-xs text-slate-200 flex-shrink-0">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span className="text-slate-300">Terminais Ativos:</span>
        <span className="font-mono font-bold text-white">{activeCount}</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {pipelineHalted && (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/15 border border-rose-400/50 rounded-xl text-xs text-rose-200">
            <PauseCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Pipeline pausado</span>
            <button
              onClick={resumePipeline}
              className="font-semibold text-rose-100 hover:text-white underline underline-offset-2"
            >
              Retomar
            </button>
          </div>
        )}

        <button
          onClick={() => setNewTerminalOpen(true)}
          title="Escolher shell, IA e skill"
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl shadow-lg shadow-sky-500/30 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Novo Terminal</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDocOpen(!docOpen)}
            title="Novo documento .md"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-700/80 hover:bg-slate-700 border border-slate-500/80 rounded-xl transition-colors shadow-sm"
          >
            <FilePlus className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden lg:inline">Documento</span>
          </button>
          {docOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50">
              <label className="block text-[11px] text-slate-400 mb-1">Nome do arquivo</label>
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
                className="w-full bg-slate-900 text-xs text-white px-2 py-1.5 rounded-lg border border-slate-600 outline-none focus:border-amber-400"
              />
              <button
                onClick={() => {
                  if (!docName.trim()) return
                  createDocumentNode(docName.trim())
                  setDocName('')
                  setDocOpen(false)
                }}
                className="mt-2 w-full px-2 py-1.5 text-xs font-semibold text-slate-900 bg-amber-300 hover:bg-amber-200 rounded-lg transition-colors"
              >
                Criar .md
              </button>
            </div>
          )}
        </div>

        <button
          onClick={createGroup}
          title="Agrupar os nós selecionados sob um título"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-700/80 hover:bg-slate-700 border border-slate-500/80 rounded-xl transition-colors shadow-sm"
        >
          <Group className="w-3.5 h-3.5 text-indigo-300" />
          <span className="hidden lg:inline">Agrupar</span>
        </button>

        <button
          onClick={() => fitView({ padding: 0.25, duration: 400 })}
          title="Centralizar Visualização"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-700/80 hover:bg-slate-700 border border-slate-500/80 rounded-xl transition-colors shadow-sm"
        >
          <Focus className="w-3.5 h-3.5 text-sky-300" />
          <span className="hidden sm:inline">Centralizar</span>
        </button>
      </div>
    </header>
  )
}
