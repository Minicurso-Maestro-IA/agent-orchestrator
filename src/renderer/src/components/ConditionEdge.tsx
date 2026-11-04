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
 * Aresta do pipeline: traço fino e preciso, rótulo compacto com fundo neutro
 * e indicador funcional sem interferência luminosa.
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
    borderRadius: 8
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
          {/* Label compacta com fundo neutro e indicação funcional */}
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide border border-[#262B34] bg-[#171A20] text-[#A0A6B2] shadow-sm transition-colors duration-140 group-hover:border-[#303641] group-hover:text-[#E6E8EC]">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {CONDITION_LABELS[condition]}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
