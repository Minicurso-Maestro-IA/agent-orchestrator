import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Play, X } from 'lucide-react'
import { useTerminalStore } from '../store/terminalStore'

/**
 * Pede a tarefa antes de pôr um agente parado para trabalhar.
 *
 * Existe porque skill e tarefa têm de chegar no MESMO prompt. Entregar só a
 * skill deixa o agente sem o que fazer, e ele inventa; digitar a tarefa direto
 * no terminal entrega a tarefa sem a skill, e ele responde fora do papel.
 */
export function StartTaskModal(): ReactElement | null {
  const id = useTerminalStore((s) => s.taskPromptFor)
  const fechar = useTerminalStore((s) => s.setTaskPromptFor)
  const startAgentNode = useTerminalStore((s) => s.startAgentNode)
  const node = useTerminalStore((s) => s.nodes.find((n) => n.id === s.taskPromptFor))

  const [texto, setTexto] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (id) {
      setTexto('')
      requestAnimationFrame(() => areaRef.current?.focus())
    }
  }, [id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && id) fechar(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [id, fechar])

  if (!id || !node) return null

  const skillName = (node.data as { skillName?: string }).skillName

  const comecar = (): void => {
    void startAgentNode(id, texto.trim() || undefined)
    fechar(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0E12]/80"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar(null)
      }}
    >
      <div className="w-full max-w-lg bg-[#0E1014] border border-[#303641] rounded-md shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#262B34] bg-[#171A20]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#E6E8EC]">
            Começar
          </h2>
          <button
            type="button"
            onClick={() => fechar(null)}
            className="p-1 rounded text-[#737B88] hover:text-[#E6E8EC] hover:bg-[#242933] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </header>

        <div className="p-4 flex flex-col gap-2">
          <p className="text-[11px] text-[#A0A6B2]">
            {skillName ? (
              <>
                A skill <span className="text-[#5B9BD5] font-mono">{skillName}</span> vai junto com
                o que você escrever aqui, num prompt só.
              </>
            ) : (
              'Este nó não tem skill: vai só o que você escrever aqui, com o protocolo.'
            )}
          </p>
          <textarea
            ref={areaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                comecar()
              }
            }}
            rows={7}
            spellCheck={false}
            placeholder="Cole aqui o pedido, ou o corpo da issue. Deixe vazio para entregar só a skill."
            className="w-full resize-y p-2.5 rounded bg-[#0B0D11] border border-[#262B34] focus:border-[#5B9BD5] outline-none text-xs leading-relaxed text-[#E6E8EC] font-mono placeholder:text-[#4A515C]"
          />
        </div>

        <footer className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[#262B34] bg-[#14171D]">
          <button
            type="button"
            onClick={() => fechar(null)}
            className="h-7 px-3 text-xs text-[#A0A6B2] hover:text-[#E6E8EC] bg-[#171A20] hover:bg-[#1D2129] border border-[#262B34] rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={comecar}
            className="h-7 px-3 text-xs font-medium text-[#0B0D11] bg-[#62B58A] hover:bg-[#7BC4A0] rounded inline-flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Começar
          </button>
        </footer>
      </div>
    </div>
  )
}
