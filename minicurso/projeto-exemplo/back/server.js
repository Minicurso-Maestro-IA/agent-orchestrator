'use strict'

/**
 * API de cobranças, com o módulo http do Node e nada mais.
 *
 * Sem Express de propósito: numa sala de 30 máquinas, cada dependência é uma
 * chance a mais de a aula travar num `npm install`. Aqui basta `node server.js`.
 */
const http = require('http')
const regras = require('./cobrancas')

const PORTA = process.env.PORT || 3001

function json(res, status, corpo) {
  const texto = JSON.stringify(corpo)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  })
  res.end(texto)
}

function lerCorpo(req) {
  return new Promise((resolve) => {
    let dados = ''
    req.on('data', (p) => (dados += p))
    req.on('end', () => {
      try {
        resolve(JSON.parse(dados || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`)

  if (req.method === 'OPTIONS') return json(res, 204, {})

  if (req.method === 'GET' && url.pathname === '/cobrancas') {
    return json(res, 200, regras.listar())
  }

  if (req.method === 'GET' && url.pathname.startsWith('/cobrancas/')) {
    const id = url.pathname.split('/')[2]
    const achada = regras.buscar(id)
    return json(res, 200, achada)
  }

  if (req.method === 'POST' && url.pathname === '/cobrancas') {
    const corpo = await lerCorpo(req)
    const nova = regras.criar(corpo)
    return json(res, 200, nova)
  }

  if (req.method === 'GET' && url.pathname === '/resumo') {
    return json(res, 200, { emAberto: regras.totalEmAberto() })
  }

  json(res, 404, { erro: 'rota não encontrada' })
})

servidor.listen(PORTA, () => {
  console.log(`API de cobranças em http://localhost:${PORTA}`)
})
