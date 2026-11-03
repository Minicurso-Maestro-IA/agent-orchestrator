export type TipoTransacao = 'RECEITA' | 'DESPESA'

export interface Categoria {
  id: number
  nome: string
  cor: string
}

export interface Transacao {
  id: number
  descricao: string
  valor: number
  tipo: TipoTransacao
  data: string
  categoria: Categoria | null
}
