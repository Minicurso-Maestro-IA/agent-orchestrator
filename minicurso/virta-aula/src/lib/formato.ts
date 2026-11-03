/**
 * Formatação de dinheiro e data, no padrão brasileiro.
 *
 * Existe para ser usada em toda tela que mostra valor ou data. Duas
 * formatações diferentes no mesmo app divergem com o tempo — uma ganha
 * separador de milhar, a outra não, e ninguém percebe até o cliente reclamar.
 */

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

/** 1234.5 → "R$ 1.234,50" */
export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

/** "2026-01-15" → "15/01/2026" */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso
}

/** "2026-01" → "Jan" */
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
export function formatarMes(iso: string): string {
  const mes = Number(iso.split('-')[1]) - 1
  return mes >= 0 && mes < 12 ? MESES[mes] : iso
}
