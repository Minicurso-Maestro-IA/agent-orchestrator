import { useEffect, useRef, type ReactElement, type ReactNode } from 'react'
import {
  X,
  Sparkles,
  BookOpen,
  TerminalSquare,
  Plus,
  CornerDownLeft,
  Info
} from 'lucide-react'
import { TerminalShell } from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

const SHELL_OPTIONS: { id: TerminalShell; label: string; badge: string; desc: string }[] = [
  { id: 'powershell', label: 'PowerShell', badge: 'PS', desc: 'Shell padrão e scripts (.ps1)' },
  { id: 'cmd', label: 'Command Prompt', badge: 'CMD', desc: 'Prompt clássico do Windows' },
  { id: 'wsl', label: 'WSL (Linux)', badge: 'WSL', desc: 'Subsistema Windows para Linux' }
]

interface SectionProps {
  icon: ReactNode
  title: string
  hint?: string
  children: ReactNode
}

function Section({ icon, title, hint, children }: SectionProps): ReactElement {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-sky-300">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

interface ChoiceProps {
  active: boolean
  disabled?: boolean
  onClick: () => void
  badge?: string
  title: string
  desc?: string
}

function Choice({ active, disabled, onClick, badge, title, desc }: ChoiceProps): ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left border transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
          : active
            ? 'bg-sky-400/20 text-sky-50 border-sky-400/60'
            : 'bg-slate-900/60 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
      }`}
    >
      {badge && (
        <span className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-600 text-sky-300 mt-0.5 flex-shrink-0">
          {badge}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-xs font-medium truncate">{title}</span>
        {desc && <span className="block text-[11px] text-slate-400 line-clamp-2">{desc}</span>}
      </span>
    </button>
  )
}

export function NewTerminalModal(): ReactElement | null {
  const open = useTerminalStore((s) => s.newTerminalOpen)
  const setOpen = useTerminalStore((s) => s.setNewTerminalOpen)
  const shell = useTerminalStore((s) => s.selectedShell)
  const setShell = useTerminalStore((s) => s.setSelectedShell)
  const agents = useTerminalStore((s) => s.agents)
  const skills = useTerminalStore((s) => s.skills)
  const agentId = useTerminalStore((s) => s.selectedAgentId)
  const setAgent = useTerminalStore((s) => s.setSelectedAgent)
  const skillId = useTerminalStore((s) => s.selectedSkillId)
  const setSkill = useTerminalStore((s) => s.setSelectedSkill)
  const addTerminal = useTerminalStore((s) => s.addTerminal)

  const confirmRef = useRef<HTMLButtonElement>(null)

  const agent = agents.find((a) => a.id === agentId)
  const skill = skills.find((s) => s.id === skillId)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
      // Ctrl/Cmd+Enter cria sem precisar tirar a mão do teclado. Enter sozinho
      // fica livre para navegar entre as opções.
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        confirmRef.current?.click()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  const create = (): void => {
    addTerminal()
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo terminal"
        className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl overflow-hidden"
      >
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-600 bg-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Novo Terminal</h2>
            <p className="text-[11px] text-slate-400">
              Escolha o shell e, opcionalmente, uma IA com uma skill de contexto
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Fechar (Esc)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Section icon={<TerminalSquare className="w-3.5 h-3.5" />} title="Shell">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SHELL_OPTIONS.map((o) => (
                <Choice
                  key={o.id}
                  active={shell === o.id}
                  onClick={() => setShell(o.id)}
                  badge={o.badge}
                  title={o.label}
                  desc={o.desc}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={<Sparkles className="w-3.5 h-3.5" />}
            title="IA"
            hint="opcional — inicia a CLI dentro do shell"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Choice
                active={!agentId}
                onClick={() => {
                  setAgent(null)
                  setSkill(null)
                }}
                title="Nenhuma"
                desc="Abre só o shell"
              />
              {agents.map((a) => (
                <Choice
                  key={a.id}
                  active={agentId === a.id}
                  onClick={() => setAgent(a.id)}
                  title={a.label}
                  desc={a.description || a.command}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={<BookOpen className="w-3.5 h-3.5" />}
            title="Skill"
            hint={agentId ? 'carregada como primeiro prompt' : 'escolha uma IA primeiro'}
          >
            {skills.length === 0 ? (
              <p className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-900/60 border border-slate-700 rounded-lg p-2.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                Nenhuma skill encontrada. Crie arquivos <span className="font-mono">.md</span> na
                pasta <span className="font-mono text-sky-300">skills/</span> do projeto.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Choice
                  active={!skillId}
                  disabled={!agentId}
                  onClick={() => setSkill(null)}
                  title="Nenhuma"
                  desc="Inicia a IA sem contexto"
                />
                {skills.map((s) => (
                  <Choice
                    key={s.id}
                    active={skillId === s.id}
                    disabled={!agentId}
                    onClick={() => setSkill(s.id)}
                    title={s.name}
                    desc={s.description}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>

        <footer className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-600 bg-slate-900/60">
          <p className="text-[11px] text-slate-400 min-w-0 truncate">
            <span className="font-mono text-slate-200">{shell}</span>
            {agent && (
              <>
                {' → '}
                <span className="font-mono text-violet-300">{agent.command}</span>
              </>
            )}
            {agent && skill && (
              <>
                {' + skill '}
                <span className="text-sky-300">{skill.name}</span>
              </>
            )}
            {agent?.install && <span className="text-slate-500"> · requer: {agent.install}</span>}
          </p>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-700/80 hover:bg-slate-700 border border-slate-500/80 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={create}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl shadow-lg shadow-sky-500/30 transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              <Plus className="w-4 h-4" />
              Criar terminal
              <kbd className="ml-1 flex items-center gap-0.5 text-[10px] font-mono opacity-70">
                <CornerDownLeft className="w-3 h-3" />
              </kbd>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
