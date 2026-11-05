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
    <section className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[#A0A6B2]">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A0A6B2]">{title}</h3>
        {hint && <span className="text-[11px] text-[#737B88]">{hint}</span>}
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
      className={`relative w-full flex items-start gap-2.5 p-2 rounded text-left border transition-colors duration-140 ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-[#262B34]/60 bg-[#14171D]/40 text-[#737B88]'
          : active
            ? 'bg-[#242933] text-[#E6E8EC] border-[#5B9BD5] ring-1 ring-[#5B9BD5]/30'
            : 'bg-[#1D2129] hover:bg-[#242933] text-[#A0A6B2] hover:text-[#E6E8EC] border-[#262B34] hover:border-[#303641]'
      }`}
    >
      {badge && (
        <span className="font-mono text-[10px] bg-[#14171D] px-1.5 py-0.5 rounded border border-[#262B34] text-[#A0A6B2] mt-0.5 flex-shrink-0">
          {badge}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium truncate">{title}</span>
        {desc && <span className="block text-[11px] text-[#737B88] line-clamp-1">{desc}</span>}
      </span>
      {active && !disabled && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#5B9BD5] mt-1.5 flex-shrink-0" />
      )}
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0E12]/80"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo terminal"
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#171A20] border border-[#303641] rounded shadow-2xl overflow-hidden"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#262B34] bg-[#14171D]">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#E6E8EC]">Novo Terminal</h2>
            <p className="text-[11px] text-[#737B88]">
              Configure o shell de execução e vincule opcionalmente um agente ou skill
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Fechar (Esc)"
            className="p-1 rounded text-[#737B88] hover:text-[#E6E8EC] hover:bg-[#242933] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            title="Agente de IA"
            hint="opcional — executa CLI assistida"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Choice
                active={!agentId}
                onClick={() => {
                  setAgent(null)
                  setSkill(null)
                }}
                title="Nenhum"
                desc="Terminal interativo comum"
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
            title="Skill de Contexto"
            hint={agentId ? 'injetada como primeira instrução' : 'selecione um agente primeiro'}
          >
            {skills.length === 0 ? (
              <p className="flex items-start gap-2 text-[11px] text-[#737B88] bg-[#14171D] border border-[#262B34] rounded p-2.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px text-[#737B88]" />
                Nenhuma skill encontrada em <span className="font-mono text-[#A0A6B2]">skills/</span>.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Choice
                  active={!skillId}
                  disabled={!agentId}
                  onClick={() => setSkill(null)}
                  title="Nenhuma"
                  desc="Inicia sem skill prévia"
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

        <footer className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#262B34] bg-[#14171D]">
          <p className="text-[11px] text-[#737B88] font-mono min-w-0 truncate">
            <span className="text-[#A0A6B2]">{shell}</span>
            {agent && (
              <>
                {' → '}
                <span className="text-[#9B8BCB]">{agent.command}</span>
              </>
            )}
            {agent && skill && (
              <>
                {' + '}
                <span className="text-[#5B9BD5]">{skill.name}</span>
              </>
            )}
          </p>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-7 px-3 text-xs text-[#A0A6B2] hover:text-[#E6E8EC] bg-[#171A20] hover:bg-[#1D2129] border border-[#262B34] rounded inline-flex items-center justify-center transition-colors duration-140"
            >
              Cancelar
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={create}
              className="h-7 px-3 text-xs font-medium text-white bg-[#5B9BD5] hover:bg-[#4E8BC4] rounded border border-[#6BAAE4]/30 shadow-sm inline-flex items-center gap-1.5 transition-colors duration-140"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar terminal</span>
              <kbd className="ml-1 text-[10px] font-mono opacity-80 inline-flex items-center">
                <CornerDownLeft className="w-3 h-3" />
              </kbd>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
