import type { Resumo as DadosResumo } from '../mock/db'
import { formatarMoeda, formatarMes } from '../lib/formato'

const COR_RECEITA = '#ef4444'
const COR_DESPESA = '#10b981'

export function Resumo({ dados }: { dados: DadosResumo }) {
  const maior = Math.max(1, ...dados.porMes.flatMap((m) => [m.receitas, m.despesas]))

  return (
    <section className="resumo">
      <div className="cartoes">
        <article className="cartao">
          <h3>Receitas</h3>
          <strong className="verde">{formatarMoeda(dados.receitas)}</strong>
        </article>
        <article className="cartao">
          <h3>Despesas</h3>
          <strong className="vermelho">{formatarMoeda(dados.despesas)}</strong>
        </article>
        <article className="cartao">
          <h3>Saldo</h3>
          <strong className={dados.saldo >= 0 ? 'verde' : 'vermelho'}>
            {formatarMoeda(dados.saldo)}
          </strong>
        </article>
      </div>

      <div className="grafico">
        {dados.porMes.map((m) => (
          <div key={m.mes} className="grafico-mes">
            <div className="barras">
              <div
                className="barra"
                style={{ height: `${(m.receitas / maior) * 100}%`, background: COR_RECEITA }}
                title={`Receitas: ${formatarMoeda(m.receitas)}`}
              />
              <div
                className="barra"
                style={{ height: `${(m.despesas / maior) * 100}%`, background: COR_DESPESA }}
                title={`Despesas: ${formatarMoeda(m.despesas)}`}
              />
            </div>
            <span className="grafico-rotulo">{formatarMes(m.mes)}</span>
          </div>
        ))}
      </div>

      <div className="legenda">
        <span><i style={{ background: COR_RECEITA }} /> Receitas</span>
        <span><i style={{ background: COR_DESPESA }} /> Despesas</span>
      </div>
    </section>
  )
}
