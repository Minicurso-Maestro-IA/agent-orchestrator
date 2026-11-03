import type { Cobranca } from '../tipos'

interface Props {
  cobrancas: Cobranca[]
}

export function ListaCobrancas({ cobrancas }: Props) {
  return (
    <table className="tabela">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Total</th>
          <th>Parcelas</th>
          <th>Valor da parcela</th>
          <th>Situação</th>
        </tr>
      </thead>
      <tbody>
        {cobrancas.map((cobranca, indice) => (
          <tr key={indice}>
            <td>{cobranca.cliente}</td>
            <td>{cobranca.total}</td>
            <td>{cobranca.parcelas}x</td>
            <td>{cobranca.total / cobranca.parcelas}</td>
            <td>{cobranca.pago ? 'Pago' : 'Em aberto'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
