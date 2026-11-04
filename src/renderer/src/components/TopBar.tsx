import { type ReactElement, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Plus, Focus, Split, PauseCircle, FilePlus, Group, Workflow } from 'lucide-react'
import { useTerminalStore, MAX_HOPS } from '../store/terminalStore'

/** Botão secundário da barra. Todos iguais, para o primário ser o único colorido. */
function BarButton({
  onClick,
  title,
  icon,
  label,
  hideBelow = 'lg'
}: {
  onClick: () => void
  title: string
  icon: ReactElement
  label: string
  hideBelow?: 'sm' | 'lg'
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center gap-2 h-9 px-3 text-[13px] font-medium text-slate-200 hover:text-white bg-slate-700/60 hover:bg-slate-700 border border-slate-600/80 hover:border-slate-500 rounded-xl transition-colors cursor-pointer"
    >
      {icon}
      <span className={hideBelow === 'sm' ? 'hidden sm:inline' : 'hidden lg:inline'}>{label}</span>
    </button>
  )
}

export function TopBar(): ReactElement {
  const { fitView } = useReactFlow()

  const nodes = useTerminalStore((s) => s.nodes)
  const setNewTerminalOpen = useTerminalStore((s) => s.setNewTerminalOpen)
  const pipelineHalted = useTerminalStore((s) => s.pipelineHalted)
  const pipelineHops = useTerminalStore((s) => s.pipelineHops)
  const resumePipeline = useTerminalStore((s) => s.resumePipeline)
  const createDocumentNode = useTerminalStore((s) => s.createDocumentNode)
  const createGroup = useTerminalStore((s) => s.createGroup)
  const [docName, setDocName] = useState('')
  const [docOpen, setDocOpen] = useState(false)

  const terminais = nodes.filter((n) => n.type === 'terminal' && n.data.active)
  const total = terminais.length
  const trabalhando = terminais.filter((n) => n.data.activity === 'working').length

  /**
   * O ponto só pulsa quando alguém está de fato trabalhando. Um indicador que
   * pisca o tempo todo é um indicador que ninguém olha.
   */
  const pulsando = trabalhando > 0
  const estado =
    total === 0
      ? 'nenhum terminal aberto'
      : trabalhando > 0
        ? `${total} ${total === 1 ? 'terminal' : 'terminais'} · ${trabalhando} trabalhando`
        : `${total} ${total === 1 ? 'terminal' : 'terminais'} · tudo ocioso`

  const criarDocumento = (): void => {
    if (!docName.trim()) return
    createDocumentNode(docName.trim())
    setDocName('')
    setDocOpen(false)
  }

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/25 flex-shrink-0">
          <Split className="w-5 h-5 rotate-90" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-tight text-white truncate leading-tight">
            IFlow
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-slate-400 truncate leading-tight mt-0.5">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              {pulsando && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  total === 0 ? 'bg-slate-600' : pulsando ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </span>
            {estado}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {pipelineHops > 0 && !pipelineHalted && (
          <div
            title="Saltos do pipeline. Ao chegar no limite o app pausa sozinho."
            className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-600/80 bg-slate-900/60 text-xs text-slate-300"
          >
            <Workflow className="w-3.5 h-3.5 text-sky-300" />
            <span className="font-mono text-slate-100">
              {pipelineHops}
              <span className="text-slate-500">/{MAX_HOPS}</span>
            </span>
          </div>
        )}

        {pipelineHalted && (
          <div className="flex items-center gap-2 h-9 px-3 bg-rose-500/15 border border-rose-400/50 rounded-xl text-xs text-rose-200">
            <PauseCircle className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Pipeline pausado</span>
            <button
              type="button"
              onClick={resumePipeline}
              className="font-semibold text-rose-100 hover:text-white underline underline-offset-2 cursor-pointer"
            >
              Retomar
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setNewTerminalOpen(true)}
          title="Escolher shell, IA e skill"
          className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl shadow-lg shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Novo terminal</span>
        </button>

        <div className="relative">
          <BarButton
            onClick={() => setDocOpen(!docOpen)}
            title="Novo documento .md no canvas"
            icon={<FilePlus className="w-4 h-4" />}
            label="Documento"
          />
          {docOpen && (
            <div className="absolute right-0 mt-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50">
              <label className="block text-xs text-slate-400 mb-1.5">Nome do arquivo</label>
              <input
                autoFocus
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') criarDocumento()
                  if (e.key === 'Escape') setDocOpen(false)
                }}
                placeholder="regras-do-projeto"
                className="w-full bg-slate-900 text-[13px] text-white px-2.5 py-2 rounded-lg border border-slate-600 outline-none focus:border-sky-400 transition-colors"
              />
              <button
                type="button"
                onClick={criarDocumento}
                className="mt-2 w-full h-9 text-[13px] font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-lg transition-all cursor-pointer"
              >
                Criar .md
              </button>
            </div>
          )}
        </div>

        <BarButton
          onClick={createGroup}
          title="Agrupar os nós selecionados sob um título"
          icon={<Group className="w-4 h-4" />}
          label="Agrupar"
        />

        <BarButton
          onClick={() => fitView({ padding: 0.25, duration: 400 })}
          title="Enquadrar tudo na tela"
          icon={<Focus className="w-4 h-4" />}
          label="Centralizar"
          hideBelow="sm"
        />
      </div>
    </header>
  )
}
