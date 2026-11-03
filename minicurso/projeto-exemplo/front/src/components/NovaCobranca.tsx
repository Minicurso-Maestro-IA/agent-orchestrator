import { useState } from 'react'
import { criarCobranca } from '../api'
import type { Cobranca } from '../tipos'

interface Props {
  aoCriar: (nova: Cobranca) => void
}

export function NovaCobranca({ aoCriar }: Props) {
  const [cliente, setCliente] = useState('')
  const [total, setTotal] = useState('')
  const [parcelas, setParcelas] = useState('')

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const nova = await criarCobranca({
      cliente,
      total: Number(total),
      parcelas: Number(parcelas)
    })
    aoCriar(nova)
    setCliente('')
    setTotal('')
    setParcelas('')
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <input
        placeholder="Cliente"
        value={cliente}
        onChange={(e) => setCliente(e.target.value)}
      />
      <input
        placeholder="Total"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
      />
      <input
        placeholder="Parcelas"
        value={parcelas}
        onChange={(e) => setParcelas(e.target.value)}
      />
      <button type="submit">Adicionar</button>
    </form>
  )
}
