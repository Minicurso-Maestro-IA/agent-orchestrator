import { useState } from 'react'
import { CATEGORIAS } from '../mock/db'
import type { Transacao, TipoTransacao } from '../tipos'

interface Props {
  aoCriar: (dados: Omit<Transacao, 'id'>) => Promise<void>
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function NovaTransacao({ aoCriar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<TipoTransacao>('DESPESA')
  const [data, setData] = useState(hoje())
  const [categoriaId, setCategoriaId] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await aoCriar({
        descricao,
        valor: Number(valor),
        tipo,
        data,
        categoria: CATEGORIAS.find((c) => String(c.id) === categoriaId) ?? null
      })
      setDescricao('')
      setValor('')
      setCategoriaId('')
      setAberto(false)
    } finally {
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <button className="primario" onClick={() => setAberto(true)}>
        + Nova transação
      </button>
    )
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <input
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <input
        placeholder="Valor"
        inputMode="decimal"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoTransacao)}>
        <option value="DESPESA">Despesa</option>
        <option value="RECEITA">Receita</option>
      </select>
      <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
        <option value="">Sem categoria</option>
        {CATEGORIAS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <button className="primario" type="submit" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Salvar'}
      </button>
      <button type="button" className="secundario" onClick={() => setAberto(false)}>
        Cancelar
      </button>
    </form>
  )
}
