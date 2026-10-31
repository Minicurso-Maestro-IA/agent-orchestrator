#!/usr/bin/env node
/**
 * Hook `Stop` do Claude Code: garante que o turno termine com um veredito no
 * pipeline do orquestrador.
 *
 * Sem ele, o pipeline depende de o agente lembrar de gravar o arquivo de status
 * descrito no protocolo. Quando ele esquece, nada roteia e o nó seguinte fica
 * parado para sempre, sem erro na tela — a falha mais difícil de diagnosticar
 * que esse desenho tem.
 *
 * Regras:
 * - Se o arquivo já existe, não encosta: o veredito explícito do agente vence.
 * - Senão, grava `approved` com `auto: true`, para o orquestrador poder dizer na
 *   tela que aquele veredito foi automático. Não tenta adivinhar reprovação
 *   lendo a resposta: procurar "reprovado" em prosa erra em frases como "não vou
 *   reprovar", e um falso "aprovado" é pior que um veredito ausente.
 *
 * Node é garantido aqui: o Claude Code é distribuído por npm, então onde ele
 * roda, o node existe.
 */
const fs = require('fs')

const LIMITE_MOTIVO = 200

function finaliza(raw) {
  try {
    const statusFile = process.env.ORCHESTRATOR_STATUS_FILE
    if (!statusFile) return
    if (fs.existsSync(statusFile)) return

    let mensagem = ''
    try {
      mensagem = String(JSON.parse(raw || '{}').last_assistant_message || '')
    } catch {
      // stdin veio quebrado; segue com motivo genérico
    }

    const primeiraLinha = mensagem
      .split('\n')
      .map((l) => l.trim())
      .find(Boolean)

    fs.writeFileSync(
      statusFile,
      JSON.stringify({
        status: 'approved',
        reason: (primeiraLinha || 'turno encerrado sem veredito explícito').slice(0, LIMITE_MOTIVO),
        auto: true
      }),
      'utf8'
    )
  } catch {
    // Um hook que falha nunca deve impedir o agente de encerrar o turno.
  }
}

let raw = ''
let pronto = false
const concluir = () => {
  if (pronto) return
  pronto = true
  finaliza(raw)
  process.exit(0)
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => (raw += c))
process.stdin.on('end', concluir)
process.stdin.on('error', concluir)
// Rede de segurança: sem stdin, grava o veredito de qualquer forma.
setTimeout(concluir, 5000)
