'use strict'

/**
 * Testes com o runner embutido do Node: `node --test`. Sem jest, sem vitest,
 * sem instalar nada.
 */
const { test } = require('node:test')
const assert = require('node:assert')
const regras = require('./cobrancas')

test('lista as cobranças iniciais', () => {
  assert.ok(regras.listar().length >= 3)
})

test('calcula a parcela de uma compra em 3 vezes', () => {
  assert.strictEqual(regras.calcularParcela(1200, 3), 400)
})

test('soma apenas o que está em aberto', () => {
  assert.strictEqual(regras.totalEmAberto(), 1200 + 4500)
})
