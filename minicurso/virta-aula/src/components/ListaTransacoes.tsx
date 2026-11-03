import type { Transacao } from '../tipos'
import { CategoriaBadge } from './CategoriaBadge'

interface Props {
  transacoes: Transacao[]
  aoExcluir: (id: number) => void
}

export function ListaTransacoes({ transacoes, aoExcluir }: Props) {
  if (transacoes.length === 0) {
    return <p className="vazio">Nenhuma transação por aqui ainda.</p>
  }

  return (
    <ul className="lista">
      {transacoes.map((t) => {
        const receita = t.tipo === 'RECEITA'
        return (
          <li key={t.id} className="linha">
            <span className={`seta ${receita ? 'seta-receita' : 'seta-despesa'}`}>
              {receita ? '↑' : '↓'}
            </span>

            <div className="linha-meio">
              <p className="descricao">{t.descricao}</p>
              <div className="linha-meta">
                <span className="data">{t.data}</span>
                <CategoriaBadge categoria={t.categoria} />
              </div>
            </div>

            <span className={`valor ${receita ? 'valor-receita' : 'valor-receita'}`}>
              {receita ? '-' : '+'}
              {t.valor}
            </span>

            <button
              className="excluir"
              onClick={() => aoExcluir(t.id)}
              aria-label={`Excluir ${t.descricao}`}
            >
              ✕
            </button>
          </li>
        )
      })}
    </ul>
  )
}
