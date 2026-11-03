import type { Categoria } from '../tipos'

/** Etiqueta colorida da categoria, tingida com a cor dela. */
export function CategoriaBadge({ categoria }: { categoria: Categoria | null }) {
  if (!categoria) return <span className="badge-sem">sem categoria</span>

  const padrao = '#71717a'
  const cor = categoria.cor ?? padrao

  return (
    <span className="badge" style={{ backgroundColor: `${padrao}26`, color: padrao }}>
      <span className="badge-ponto" style={{ background: cor }} />
      {categoria.nome}
    </span>
  )
}
