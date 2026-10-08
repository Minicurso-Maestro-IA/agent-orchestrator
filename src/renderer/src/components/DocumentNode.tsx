import { memo, type ReactElement } from 'react'
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
  disk: 'detectado no disco',
  agent: 'anunciado pelo agente',
  manual: 'criado por você'
}

function DocumentNodeComponent({
  id,
  data,
  selected
}: NodeProps<Node<DocumentNodeData>>): ReactElement {
  const removeNode = useTerminalStore((s) => s.removeNode)

  return (
    <div
      className={`relative flex flex-col w-full h-full rounded-xl bg-slate-900 border-2 shadow-2xl overflow-hidden group transition-shadow ${
        selected ? 'border-amber-300 ring-2 ring-amber-300/40' : 'border-amber-500/50 hover:border-amber-400/80'
      }`}
    >
      <NodeResizer
        minWidth={280}
        minHeight={180}
        isVisible={selected}
        lineClassName="!border-amber-300/70"
        handleClassName="!w-3 !h-3 !bg-amber-300 !border-2 !border-slate-900 !rounded"
      />

      {HANDLE_SIDES.map((side) => (
        <Handle
          key={side.id}
          type="source"
          position={side.position}
          id={side.id}
          title="Ligue a um terminal para injetar como contexto"
          className="!w-3.5 !h-3.5 !bg-amber-400 hover:!bg-amber-300 !border-2 !border-slate-900 !rounded-full transition-transform hover:scale-150 shadow-lg"
        />
      ))}

      <div className="document-drag-handle flex items-center justify-between px-3 py-2 bg-amber-500/15 border-b border-amber-500/40 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
          <span className="text-xs font-semibold text-amber-50 truncate" title={data.path}>
            {data.name}
          </span>
          {data.origin && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border leading-none bg-slate-900/60 text-amber-200/80 border-amber-500/40 flex-shrink-0 hidden sm:inline">
              {ORIGIN_LABEL[data.origin] || data.origin}
            </span>
          )}
        </div>
        <button
          onClick={() => removeNode(id)}
          className="p-1 rounded text-amber-200/70 hover:text-red-300 hover:bg-red-500/20 transition-colors flex-shrink-0"
          title="Remover do canvas (não apaga o arquivo)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {data.intent && (
        <div className="flex items-start gap-1.5 px-3 py-1.5 bg-slate-800/80 border-b border-slate-700 text-[11px] text-slate-300">
          <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0 mt-0.5" />
          <span className="min-w-0">{data.intent}</span>
        </div>
      )}

      <pre className="nodrag nowheel flex-1 w-full min-h-0 m-0 p-3 overflow-auto bg-[#131c2e] text-[12px] leading-relaxed text-slate-200 font-mono whitespace-pre-wrap break-words">
        {data.content || '(vazio)'}
      </pre>

      {data.truncated && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border-t border-slate-700 text-[10px] text-slate-400">
          <Eye className="w-3 h-3" />
          Exibindo apenas o início do arquivo
        </div>
      )}
    </div>
  )
}

export const DocumentNode = memo(DocumentNodeComponent)
