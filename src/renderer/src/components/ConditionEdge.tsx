import { type ReactElement } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps
} from '@xyflow/react'
import { EdgeCondition } from '@shared/types'
import { CONDITION_COLORS, CONDITION_LABELS, useTerminalStore } from '../store/terminalStore'

/**
 * Aresta do pipeline. O rótulo mostra em qual veredito ela dispara e cicla
 * entre sempre → aprovado → reprovado a cada clique.
 */
export function ConditionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data
}: EdgeProps): ReactElement {
  const cycle = useTerminalStore((s) => s.cycleEdgeCondition)

  const condition = ((data as { condition?: EdgeCondition } | undefined)?.condition ||
    'always') as EdgeCondition
  const color = CONDITION_COLORS[condition]

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12
  })

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            cycle(id)
          }}
          title="Clique para alternar: sempre → aprovado → reprovado"
          className="nodrag nopan absolute pointer-events-auto px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-lg transition-transform hover:scale-110 cursor-pointer"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: '#0f172a',
            borderColor: color,
            color
          }}
        >
          {CONDITION_LABELS[condition]}
        </button>
      </EdgeLabelRenderer>
    </>
  )
}
