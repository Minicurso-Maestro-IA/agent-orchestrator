'use strict'

/**
 * Regras de cobrança. É aqui que mora a lógica de negócio — e os problemas que
 * os alunos vão resolver com o agente.
 */

/** Banco de dados de mentira: some quando o processo morre, e é o suficiente. */
const cobrancas = [
  { id: 1, cliente: 'Padaria do Zé', total: 1200, parcelas: 3, pago: false },
  { id: 2, cliente: 'Mercado Lua', total: 890.5, parcelas: 1, pago: true },
  { id: 3, cliente: 'Oficina Rocha', total: 4500, parcelas: 12, pago: false }
]

let proximoId = 4

function listar() {
  return cobrancas
}

function buscar(id) {
  return cobrancas.find((c) => c.id === Number(id))
}

function criar(dados) {
  const nova = {
    id: proximoId++,
    cliente: dados.cliente,
    total: dados.total,
    parcelas: dados.parcelas,
    pago: false
  }
  cobrancas.push(nova)
  return nova
}

function calcularParcela(total, parcelas) {
  return total / parcelas
}

function aplicarJuros(valor, taxaAoMes, meses) {
  return valor * Math.pow(1 + taxaAoMes, meses)
}

function totalEmAberto() {
  return cobrancas.filter((c) => !c.pago).reduce((soma, c) => soma + c.total, 0)
}

module.exports = {
  listar,
  buscar,
  criar,
  calcularParcela,
  aplicarJuros,
  totalEmAberto
}
