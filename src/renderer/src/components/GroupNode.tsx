import { memo, useEffect, useRef, useState, type ReactElement } from 'react'
import { NodeProps, Node, NodeResizer } from '@xyflow/react'
import { X, Pencil } from 'lucide-react'
import { GroupNodeData } from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

/**
 * Moldura que agrupa terminais e documentos sob um título editável. Os nós de
 * dentro são filhos de verdade (parentId), então arrastar o grupo leva todos.
 */
function GroupNodeComponent({ id, data, selected }: NodeProps<Node<GroupNodeData>>): ReactElement {
  const renameGroup = useTerminalStore((s) => s.renameGroup)
  const removeNode = useTerminalStore((s) => s.removeNode)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setDraft(data.title), [data.title])
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = (): void => {
    const next = draft.trim()
    if (next) renameGroup(id, next)
    else setDraft(data.title)
    setEditing(false)
  }

  return (
    <div
      className={`w-full h-full rounded-2xl border-2 border-dashed transition-colors ${
        selected ? 'border-indigo-300 bg-indigo-400/10' : 'border-indigo-400/50 bg-indigo-400/5'
      }`}
    >
      <NodeResizer
        minWidth={320}
        minHeight={240}
        isVisible={selected}
        lineClassName="!border-indigo-300/70"
        handleClassName="!w-3 !h-3 !bg-indigo-300 !border-2 !border-slate-900 !rounded"
      />

      {/* Título pairando acima da moldura */}
      <div className="group-drag-handle absolute -top-9 left-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-indigo-400/60 shadow-xl cursor-grab active:cursor-grabbing">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(data.title)
                setEditing(false)
              }
              e.stopPropagation()
            }}
            className="nodrag bg-slate-900 text-sm font-semibold text-white px-2 py-0.5 rounded border border-indigo-400 outline-none min-w-[160px]"
          />
        ) : (
          <>
            <span className="text-sm font-semibold text-indigo-100 whitespace-nowrap">
              {data.title}
            </span>
            <button
              onClick={() => setEditing(true)}
              title="Renomear grupo"
              className="nodrag p-1 rounded text-indigo-200/70 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => removeNode(id)}
              title="Desfazer grupo (mantém os nós)"
              className="nodrag p-1 rounded text-indigo-200/70 hover:text-red-300 hover:bg-red-500/20 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export const GroupNode = memo(GroupNodeComponent)
