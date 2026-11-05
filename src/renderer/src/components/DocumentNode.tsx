import { memo, useEffect, useRef, useState, type ReactElement } from 'react'
import { Handle, Position, NodeProps, Node, NodeResizer } from '@xyflow/react'
import { FileText, X, Sparkles, Eye } from 'lucide-react'
import { DocumentNodeData } from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

const HANDLE_SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left }
] as const

const ORIGIN_LABEL: Record<string, string> = {
  disk: 'disco',
  agent: 'agente',
  manual: 'manual'
}

function DocumentNodeComponent({
  id,
  data,
  selected
}: NodeProps<Node<DocumentNodeData>>): ReactElement {
  const removeNode = useTerminalStore((s) => s.removeNode)

  // Documento que você criou é editável aqui mesmo; o que o agente escreveu, e
  // o que veio do disco, continua só de leitura — dois lados escrevendo no
  // mesmo arquivo sem trava é pedir para perder trabalho.
  const editavel = data.origin === 'manual'
  const [rascunho, setRascunho] = useState(data.content)
  const editandoRef = useRef(false)
  const gravacaoRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Enquanto o cursor está no campo, o que vem do watcher é ignorado: senão a
  // nossa própria gravação voltaria por cima do que está sendo digitado.
  useEffect(() => {
    if (!editandoRef.current) setRascunho(data.content)
  }, [data.content])

  useEffect(() => {
    return () => {
      if (gravacaoRef.current) clearTimeout(gravacaoRef.current)
    }
  }, [])

  const aoDigitar = (texto: string): void => {
    setRascunho(texto)
    if (gravacaoRef.current) clearTimeout(gravacaoRef.current)
    gravacaoRef.current = setTimeout(() => {
      window.orchestrator?.writeDocumentFile(data.path, texto).catch((err) => {
        console.warn('[DocumentNode] Falha ao gravar', data.path, err)
      })
    }, 400)
  }

  return (
    <div
      className={`relative flex flex-col w-full h-full rounded-md bg-[#0E1014] border transition-colors duration-150 overflow-hidden group shadow-md ${
        selected ? 'border-[#D6A45D] ring-1 ring-[#D6A45D]/50' : 'border-[#262B34] hover:border-[#303641]'
      }`}
    >
      <NodeResizer
        minWidth={280}
        minHeight={180}
        isVisible={selected}
        lineClassName="!border-[#D6A45D]/60"
        handleClassName="!w-2 !h-2 !bg-[#D6A45D] !border !border-[#0E1014] !rounded-none"
      />

      {HANDLE_SIDES.map((side) => (
        <Handle
          key={side.id}
          type="source"
          position={side.position}
          id={side.id}
          title="Ligue a um terminal para injetar como contexto"
          className="!w-2 !h-2 !bg-[#1D2129] hover:!bg-[#D6A45D] !border !border-[#303641] hover:!border-[#D6A45D] !rounded-none transition-colors"
        />
      ))}

      {/* Cabeçalho do Documento */}
      <div className="document-drag-handle h-8 px-2.5 bg-[#171A20] border-b border-[#262B34] flex items-center justify-between cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-[#D6A45D] flex-shrink-0" />
          <span className="text-xs font-medium text-[#E6E8EC] truncate" title={data.path}>
            {data.name}
          </span>
          {data.origin && (
            <span className="text-[10px] font-mono text-[#737B88] px-1 py-0.2 rounded bg-[#14171D] border border-[#262B34] flex-shrink-0 hidden sm:inline">
              {ORIGIN_LABEL[data.origin] || data.origin}
            </span>
          )}
        </div>
        <button
          onClick={() => removeNode(id)}
          className="p-1 rounded text-[#737B88] hover:text-[#D87979] hover:bg-[#242933] transition-colors flex-shrink-0"
          title="Remover do canvas"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Intenção do Agente (Contextual e Compacta) */}
      {data.intent && (
        <div className="flex items-start gap-1.5 px-2.5 py-1.5 bg-[#14171D] border-b border-[#262B34] text-[11px] text-[#A0A6B2]">
          <Sparkles className="w-3 h-3 text-[#D6A45D] flex-shrink-0 mt-0.5" />
          <span className="min-w-0 line-clamp-2">{data.intent}</span>
        </div>
      )}

      {/* Conteúdo Técnico */}
      {editavel ? (
        <textarea
          value={rascunho}
          onChange={(e) => aoDigitar(e.target.value)}
          onFocus={() => {
            editandoRef.current = true
          }}
          onBlur={() => {
            editandoRef.current = false
          }}
          spellCheck={false}
          placeholder="Escreva aqui. O arquivo em disco é gravado sozinho."
          className="nodrag nowheel nopan flex-1 w-full min-h-0 m-0 p-3 resize-none overflow-auto bg-[#0E1014] text-xs leading-relaxed text-[#E6E8EC] font-mono outline-none border-none placeholder:text-[#4A515C]"
        />
      ) : (
        <pre className="nodrag nowheel flex-1 w-full min-h-0 m-0 p-3 overflow-auto bg-[#0E1014] text-xs leading-relaxed text-[#A0A6B2] font-mono whitespace-pre-wrap break-words">
          {data.content || '(vazio)'}
        </pre>
      )}

      {/* Indicador de Conteúdo Truncado */}
      {data.truncated && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#14171D] border-t border-[#262B34] text-[10px] text-[#737B88]">
          <Eye className="w-3 h-3 flex-shrink-0" />
          <span>Exibindo apenas o início do arquivo</span>
        </div>
      )}
    </div>
  )
}

export const DocumentNode = memo(DocumentNodeComponent)
