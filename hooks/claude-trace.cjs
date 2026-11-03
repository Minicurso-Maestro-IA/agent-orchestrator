#!/usr/bin/env node
/**
 * Hook `PostToolUse` do Claude Code: transforma cada ação do agente numa linha
 * que o orquestrador mostra no nó.
 *
 * Existe para a aula. O terminal já mostra o que o agente faz, mas em prosa, no
 * meio da resposta e rolando para fora da tela. Numa sala, o aluno precisa olhar
 * o nó e entender em dois segundos o que aquela IA está fazendo: leu um arquivo,
 * escreveu outro, rodou um comando.
 *
 * Grava uma linha JSON por ação (JSONL) em ORCHESTRATOR_TRACE_FILE. Uma linha por
 * evento é o que permite ao app ler só o que chegou desde a última leitura, em vez
 * de reprocessar o arquivo inteiro a cada ciclo.
 */
const fs = require('fs')
const path = require('path')

const LIMITE_ROTULO = 60

/** Rótulo curto, legível de longe, por tipo de ferramenta. */
function rotulo(nome, entrada) {
  const e = entrada && typeof entrada === 'object' ? entrada : {}
  const arquivo = (p) => (typeof p === 'string' ? path.basename(p) : '')

  switch (nome) {
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return arquivo(e.file_path || e.notebook_path)
    case 'Bash':
      return typeof e.command === 'string' ? e.command : ''
    case 'Glob':
    case 'Grep':
      return typeof e.pattern === 'string' ? e.pattern : ''
    case 'WebFetch':
      try {
        return new URL(String(e.url)).hostname
      } catch {
        return ''
      }
    case 'WebSearch':
      return typeof e.query === 'string' ? e.query : ''
    case 'Task':
      return typeof e.description === 'string' ? e.description : ''
    case 'TodoWrite':
      return Array.isArray(e.todos) ? `${e.todos.length} itens` : ''
    default:
      return ''
  }
}

let raw = ''
let pronto = false

function concluir() {
  if (pronto) return
  pronto = true
  try {
    const destino = process.env.ORCHESTRATOR_TRACE_FILE
    if (!destino) return process.exit(0)

    const evento = JSON.parse(raw || '{}')
    const nome = typeof evento.tool_name === 'string' ? evento.tool_name : '?'

    const linha = JSON.stringify({
      at: Date.now(),
      tool: nome,
      label: String(rotulo(nome, evento.tool_input) || '').slice(0, LIMITE_ROTULO),
      ms: typeof evento.duration_ms === 'number' ? evento.duration_ms : undefined
    })

    fs.appendFileSync(destino, linha + '\n', 'utf8')
  } catch {
    // Um hook que falha nunca deve interromper o trabalho do agente.
  }
  process.exit(0)
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => (raw += c))
process.stdin.on('end', concluir)
process.stdin.on('error', concluir)
setTimeout(concluir, 4000)
