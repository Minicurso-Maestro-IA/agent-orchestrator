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
        {/* Zona de hover estável e ampliada: evita flicker ao passar o mouse perto da borda */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            cycle(id)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              cycle(id)
            }
          }}
          title="Clique para alternar condição: sempre → aprovado → reprovado"
          className="nodrag nopan absolute flex items-center justify-center p-2.5 cursor-pointer select-none group"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all'
          }}
        >
          {/* Tag com feedback visual de brilho e luminosidade, sem alteração geométrica que cause jitter */}
          <span
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-lg transition-all duration-200 ease-out group-hover:brightness-125 group-hover:bg-slate-800/95"
            style={{
              background: '#0f172a',
              borderColor: color,
              color,
              boxShadow: `0 0 10px ${color}25, 0 2px 6px rgba(0,0,0,0.5)`
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
            />
            {CONDITION_LABELS[condition]}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
