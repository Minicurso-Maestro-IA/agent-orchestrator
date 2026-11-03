import type { Cobranca } from './tipos'

const BASE = 'http://localhost:3001'

export async function buscarCobrancas(): Promise<Cobranca[]> {
  const resposta = await fetch(`${BASE}/cobrancas`)
  return resposta.json()
}

export async function criarCobranca(dados: {
  cliente: string
  total: number
  parcelas: number
}): Promise<Cobranca> {
  const resposta = await fetch(`${BASE}/cobrancas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
  return resposta.json()
}
