#!/usr/bin/env node
/**
 * Mede se o `agy` obedece ao protocolo de orquestração.
 *
 *   node medir-agy.mjs
 *   node medir-agy.mjs --tentativas 5 --timeout 180 --skip-permissoes
 *
 * A pergunta que isto responde: de N tentativas, em quantas o agente grava o
 * arquivo de status sozinho, sem ninguém lembrar? É disso que o pipeline
 * inteiro depende. Com o Claude Code existe um hook que grava mesmo se o
 * modelo esquecer; com o `agy` não existe — depende de obediência, e
 * obediência se mede.
 *
 * O teste roda o `agy` com EXATAMENTE os mesmos argumentos, o mesmo prompt e
 * as mesmas variáveis de ambiente que o orquestrador usa. Se passar aqui,
 * passa lá.
 *
 * Não toca em nenhum projeto seu: cria uma pasta descartável.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const BASE = path.join(os.homedir(), 'teste-agy')

const args = process.argv.slice(2)
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`)
  return i >= 0 ? args[i + 1] : padrao
}
const TENTATIVAS = Number(opcao('tentativas', 5))
const TIMEOUT_S = Number(opcao('timeout', 180))
const SKIP = args.includes('--skip-permissoes')

const linha = (c = '-') => console.log(c.repeat(66))
const passo = (t) => { console.log(); linha('='); console.log(t); linha('=') }

/** O bloco de protocolo, copiado do que o orquestrador injeta em todo prompt. */
function protocolo(statusFile) {
  return `## Protocolo de orquestracao

Voce faz parte de um pipeline de agentes. Ao concluir sua tarefa, sua ULTIMA acao
deve ser gravar exatamente este arquivo JSON:

${statusFile}

{ "status": "approved", "reason": "<uma frase>", "files": ["<arquivos tocados>"] }

Use "rejected" no lugar de "approved" apenas se voce esta revisando um trabalho e
ele precisa de ajustes - nesse caso explique em "reason" o que deve ser corrigido.
Se voce nao esta revisando nada, use "approved" ao terminar sua parte.
Grave o arquivo mesmo que a tarefa tenha falhado, explicando o motivo em "reason".`
}

/** Uma tarefa pequena, mas que obriga o agente a ler e a escrever de verdade. */
function montarProjeto(dir) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'precos.js'),
    [
      'export function formatar(valor) {',
      '  return valor;',
      '}',
      ''
    ].join('\n')
  )
}

const TAREFA = [
  '## Sua tarefa',
  '',
  'No arquivo precos.js desta pasta, a funcao formatar devolve o numero cru.',
  'Faca ela devolver o valor em reais, no formato brasileiro: 1234.5 vira',
  '"R$ 1.234,50". Nao crie arquivo novo, nao instale nada, edite so precos.js.'
].join('\n')

function achouAgy() {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['agy'], { encoding: 'utf8' })
  return r.status === 0 ? (r.stdout || '').trim().split(/\r?\n/)[0] : null
}

function matar(filho) {
  if (!filho || filho.exitCode !== null) return
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(filho.pid), '/T', '/F'])
    else filho.kill('SIGKILL')
  } catch { /* ja morreu */ }
}

async function tentativa(n, exe) {
  const dir = path.join(BASE, `tentativa-${n}`)
  fs.rmSync(dir, { recursive: true, force: true })
  montarProjeto(dir)

  const statusFile = path.join(dir, 'status.json')
  const promptFile = path.join(dir, 'prompt.md')
  fs.writeFileSync(promptFile, `${TAREFA}\n\n---\n\n${protocolo(statusFile)}\n`)

  const argumentos = ['-i', `Leia e siga as instrucoes do arquivo ${promptFile}`]
  if (SKIP) argumentos.unshift('--dangerously-skip-permissions')

  passo(`TENTATIVA ${n} de ${TENTATIVAS}`)
  console.log(`pasta:  ${dir}`)
  console.log(`comando: agy ${argumentos.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`)
  console.log(`\nO agy abre agora. NAO digite nada: deixe ele trabalhar sozinho.`)
  console.log(`Fecho sozinho quando o status aparecer, ou em ${TIMEOUT_S}s.\n`)

  const inicio = Date.now()
  // Sem shell, e com o caminho ja resolvido: no Windows o shell NAO protege
  // argumento com espaco, e a instrucao chegaria picotada ao agente.
  const filho = spawn(exe, argumentos, {
    cwd: dir,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      ORCHESTRATOR_STATUS_FILE: statusFile,
      ORCHESTRATOR_TERMINAL_ID: `teste-${n}`
    }
  })

  const resultado = await new Promise((resolver) => {
    let pronto = false
    const terminar = (r) => { if (!pronto) { pronto = true; clearInterval(relogio); resolver(r) } }

    const relogio = setInterval(() => {
      const s = Math.round((Date.now() - inicio) / 1000)
      if (fs.existsSync(statusFile)) {
        const bruto = fs.readFileSync(statusFile, 'utf8')
        let json = null
        try { json = JSON.parse(bruto) } catch { /* gravou algo que nao e JSON */ }
        return terminar({ ok: true, segundos: s, json, bruto: bruto.slice(0, 300) })
      }
      if (s >= TIMEOUT_S) terminar({ ok: false, segundos: s })
    }, 500)

    filho.on('error', (err) => terminar({ ok: false, segundos: 0, erro: err.message }))

    filho.on('exit', (code) => {
      // Saiu sem gravar: espera meio segundo (pode estar escrevendo) e desiste.
      setTimeout(() => {
        if (fs.existsSync(statusFile)) return
        terminar({ ok: false, segundos: Math.round((Date.now() - inicio) / 1000), saiu: code })
      }, 600)
    })
  })

  matar(filho)
  await new Promise((r) => setTimeout(r, 1500))

  const editou = fs.readFileSync(path.join(dir, 'precos.js'), 'utf8').includes('return valor;') === false
  return { ...resultado, editou }
}

async function main() {
  const caminho = achouAgy()
  if (!caminho) {
    console.error(
      '\nNao achei o `agy` no PATH.' +
      '\n  Instale:  irm https://antigravity.google/cli/install.ps1 | iex' +
      '\n  Depois abra um terminal NOVO e rode `agy` uma vez para fazer login.\n'
    )
    process.exit(1)
  }

  console.log(`\nagy encontrado em: ${caminho}`)
  console.log(`tentativas: ${TENTATIVAS}   timeout: ${TIMEOUT_S}s   permissoes: ${SKIP ? 'puladas' : 'como no orquestrador hoje'}`)
  console.log(`\nANTES DE COMECAR: abra o agy em outra janela, digite /usage e anote o numero.`)
  console.log(`Sem isso nao da para saber quanto uma volta do pipeline custa.\n`)

  const resultados = []
  for (let n = 1; n <= TENTATIVAS; n++) resultados.push(await tentativa(n, caminho))

  passo('RESULTADO')
  console.log('  #   status      tempo   JSON valido   veredito    editou o arquivo')
  linha()
  for (const [i, r] of resultados.entries()) {
    if (r.erro) { console.log(`  ${String(i + 1).padEnd(3)} ERRO AO ABRIR  ${r.erro}`); continue }
    const valido = r.json ? 'sim' : r.ok ? 'NAO' : '-'
    const veredito = r.json?.status ?? '-'
    console.log(
      `  ${String(i + 1).padEnd(3)} ${(r.ok ? 'gravou' : 'NAO GRAVOU').padEnd(11)} ` +
      `${String(r.segundos + 's').padEnd(7)} ${valido.padEnd(13)} ${String(veredito).padEnd(11)} ${r.editou ? 'sim' : 'nao'}`
    )
  }
  linha()

  const gravou = resultados.filter((r) => r.ok && r.json).length
  const tempos = resultados.filter((r) => r.ok).map((r) => r.segundos)
  const media = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0

  console.log(`\nObedeceu ao protocolo: ${gravou} de ${TENTATIVAS}`)
  if (tempos.length) console.log(`Tempo medio ate o status: ${media}s`)
  console.log(`\nAGORA: volte no agy, digite /usage e veja quanto caiu.`)
  console.log(`Divida por ${TENTATIVAS} para saber o custo de UM agente. O pipeline`)
  console.log(`de tres gasta o triplo disso, e cada reprovacao soma mais dois passos.\n`)

  if (gravou < TENTATIVAS) {
    console.log('Alguma tentativa nao gravou. Vale olhar, na pasta da tentativa, se o')
    console.log('agente pediu permissao e ficou esperando: nesse caso rode de novo com')
    console.log('--skip-permissoes e compare. A diferenca entre os dois numeros e')
    console.log('exatamente o que voce precisa decidir antes da aula.\n')
  }

  fs.writeFileSync(
    path.join(BASE, 'resultado.json'),
    JSON.stringify({ quando: new Date().toISOString(), skipPermissoes: SKIP, resultados }, null, 2)
  )
  console.log(`Detalhe completo em: ${path.join(BASE, 'resultado.json')}\n`)
}

main()
