import type { Categoria, Transacao, TipoTransacao } from '../tipos'

/**
 * O "banco de dados" da aula: mora no navegador.
 *
 * Nada de servidor, Java ou Postgres. Na primeira abertura, semeia os dados;
 * nas seguintes, carrega o que estiver gravado. É isso que faz o mesmo código
 * rodar igual no site publicado e na máquina de quem clonou o repositório.
 */

const CHAVE = 'virta-aula-dados'

export const CATEGORIAS: Categoria[] = [
  { id: 1, nome: 'Mercado', cor: '#f97316' },
  { id: 2, nome: 'Transporte', cor: '#3b82f6' },
  { id: 3, nome: 'Moradia', cor: '#a855f7' },
  { id: 4, nome: 'Salário', cor: '#10b981' },
  { id: 5, nome: 'Lazer', cor: '#ec4899' }
]

const SEMENTE: Transacao[] = [
  { id: 1, descricao: 'Salário de janeiro', valor: 5400, tipo: 'RECEITA', data: '2026-01-05', categoria: CATEGORIAS[3] },
  { id: 2, descricao: 'Compra do mês', valor: 842.9, tipo: 'DESPESA', data: '2026-01-07', categoria: CATEGORIAS[0] },
  { id: 3, descricao: 'Aluguel', valor: 1850, tipo: 'DESPESA', data: '2026-01-10', categoria: CATEGORIAS[2] },
  { id: 4, descricao: 'Combustível', valor: 320.45, tipo: 'DESPESA', data: '2026-01-12', categoria: CATEGORIAS[1] },
  { id: 5, descricao: 'Freelance de fim de semana', valor: 1200, tipo: 'RECEITA', data: '2026-01-15', categoria: null },
  { id: 6, descricao: 'Jantar de aniversário com a família toda no restaurante novo do centro', valor: 287.6, tipo: 'DESPESA', data: '2026-01-18', categoria: CATEGORIAS[4] },
  { id: 7, descricao: 'Passagem de ônibus', valor: 180, tipo: 'DESPESA', data: '2026-02-02', categoria: CATEGORIAS[1] },
  { id: 8, descricao: 'Salário de fevereiro', valor: 5400, tipo: 'RECEITA', data: '2026-02-05', categoria: CATEGORIAS[3] }
]

/** Espera curta de propósito: sem ela, nenhum estado de carregamento aparece. */
const ATRASO_MS = 400
const esperar = () => new Promise<void>((ok) => setTimeout(ok, ATRASO_MS))

function carregar(): Transacao[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (bruto) return JSON.parse(bruto) as Transacao[]
  } catch {
    // Navegador em aba anônima ou armazenamento bloqueado: segue com a semente.
  }
  gravar(SEMENTE)
  return SEMENTE
}

function gravar(dados: Transacao[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados))
  } catch {
    // Sem persistência o app continua funcionando, só esquece ao recarregar.
  }
}

export async function listarTransacoes(tipo?: TipoTransacao): Promise<Transacao[]> {
  await esperar()
  const todas = carregar()
  const filtradas = tipo ? todas.filter((t) => t.tipo === tipo) : todas
  // Mais recentes primeiro; o id desempata transações do mesmo dia.
  return [...filtradas].sort((a, b) => (a.data === b.data ? b.id - a.id : a.data < b.data ? 1 : -1))
}

export async function criarTransacao(dados: Omit<Transacao, 'id'>): Promise<Transacao> {
  await esperar()
  const todas = carregar()
  const nova: Transacao = { ...dados, id: Math.max(0, ...todas.map((t) => t.id)) + 1 }
  gravar([...todas, nova])
  return nova
}

export async function excluirTransacao(id: number): Promise<void> {
  await esperar()
  gravar(carregar().filter((t) => t.id !== id))
}

export interface Resumo {
  receitas: number
  despesas: number
  saldo: number
  porMes: { mes: string; receitas: number; despesas: number }[]
}

export async function obterResumo(): Promise<Resumo> {
  await esperar()
  const todas = carregar()
  const soma = (t: TipoTransacao) =>
    todas.filter((x) => x.tipo === t).reduce((s, x) => s + x.valor, 0)

  const meses = new Map<string, { receitas: number; despesas: number }>()
  for (const t of todas) {
    const mes = t.data.slice(0, 7)
    const atual = meses.get(mes) ?? { receitas: 0, despesas: 0 }
    if (t.tipo === 'RECEITA') atual.receitas += t.valor
    else atual.despesas += t.valor
    meses.set(mes, atual)
  }

  return {
    receitas: soma('RECEITA'),
    despesas: soma('DESPESA'),
    saldo: soma('RECEITA') - soma('DESPESA'),
    porMes: [...meses.entries()].sort().map(([mes, v]) => ({ mes, ...v }))
  }
}

/** Devolve tudo ao estado inicial. Usado pelo botão de recomeçar. */
export function recomecar(): void {
  gravar(SEMENTE)
}
