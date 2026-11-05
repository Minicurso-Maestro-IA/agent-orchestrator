import { memo, useEffect, useRef, useState, type ReactElement } from 'react'
import { NodeProps, Node, NodeResizer } from '@xyflow/react'
import { X, Pencil } from 'lucide-react'
import { GroupNodeData } from '@shared/types'
import { useTerminalStore } from '../store/terminalStore'

/**
 * Moldura industrial que agrupa nós sob um delimitador estrutural discreto.
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
      className={`w-full h-full rounded-md border border-dashed transition-colors ${
        selected ? 'border-[#5B9BD5]/60 bg-[#5B9BD5]/5' : 'border-[#303641] bg-[#171A20]/20'
      }`}
    >
      <NodeResizer
        minWidth={320}
        minHeight={240}
        isVisible={selected}
        lineClassName="!border-[#5B9BD5]/50"
        handleClassName="!w-2 !h-2 !bg-[#5B9BD5] !border !border-[#0B0D11] !rounded-none"
      />

      {/* Rótulo do Grupo */}
      <div className="group-drag-handle absolute -top-8 left-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#171A20] border border-[#262B34] shadow-md cursor-grab active:cursor-grabbing select-none">
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
            className="nodrag bg-[#0C0E12] text-xs font-medium text-[#E6E8EC] px-2 py-0.5 rounded border border-[#5B9BD5] outline-none min-w-[140px]"
          />
        ) : (
          <>
            <span className="text-xs font-medium text-[#E6E8EC] whitespace-nowrap">
              {data.title}
            </span>
            <button
              onClick={() => setEditing(true)}
              title="Renomear grupo"
              className="nodrag p-0.5 rounded text-[#737B88] hover:text-[#E6E8EC] hover:bg-[#242933] transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => removeNode(id)}
              title="Desfazer grupo (mantém os nós)"
              className="nodrag p-0.5 rounded text-[#737B88] hover:text-[#D87979] hover:bg-[#242933] transition-colors"
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
