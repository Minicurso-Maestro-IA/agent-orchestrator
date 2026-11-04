#!/usr/bin/env node
/**
 * Instalador para as máquinas do laboratório.
 *
 * Roda de dentro da pasta descompactada, ao lado do executável. Não precisa de
 * administrador: tudo vai para a pasta do usuário.
 *
 *   node instalar.mjs
 *
 * Escrito em Node, e não em PowerShell, por dois motivos: roda igual no cmd e
 * no PowerShell, e pôde ser testado antes de chegar numa máquina de verdade.
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const EXE = 'IFlow.exe'

const passo = (t) => console.log(`\n==> ${t}`)
const ok = (t) => console.log(`    OK  ${t}`)
const aviso = (t) => console.log(`    !   ${t}`)

function copiarPasta(de, para) {
  let total = 0
  for (const item of fs.readdirSync(de, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === 'dist') continue
    const origem = path.join(de, item.name)
    const destino = path.join(para, item.name)
    if (item.isDirectory()) {
      fs.mkdirSync(destino, { recursive: true })
      total += copiarPasta(origem, destino)
    } else {
      fs.copyFileSync(origem, destino)
      total++
    }
  }
  return total
}

/** Atalho na área de trabalho, via COM do Windows. Falhar aqui não é fatal. */
function criarAtalho(exe, trabalho) {
  const desktop = path.join(os.homedir(), 'Desktop')
  if (!fs.existsSync(desktop)) return aviso('área de trabalho não encontrada; crie o atalho na mão')

  const lnk = path.join(desktop, 'IFlow.lnk')
  const ps = [
    '$s = New-Object -ComObject WScript.Shell',
    `$a = $s.CreateShortcut(${JSON.stringify(lnk)})`,
    `$a.TargetPath = ${JSON.stringify(exe)}`,
    `$a.WorkingDirectory = ${JSON.stringify(trabalho)}`,
    "$a.Description = 'IFlow - orquestrador de agentes de IA'",
    '$a.Save()'
  ].join('; ')

  const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' })
  if (r.status === 0 && fs.existsSync(lnk)) ok(lnk)
  else aviso(`não consegui criar o atalho; abra o ${EXE} direto da pasta`)
}

function main() {
  const ehWindows = process.platform === 'win32'
  const exe = path.join(AQUI, EXE)

  if (!fs.existsSync(exe)) {
    console.error(
      `✖ Não achei "${EXE}" aqui ao lado.` +
        '\n  Rode este arquivo de dentro da pasta descompactada do orquestrador.'
    )
    process.exit(1)
  }

  const base = ehWindows ? 'C:\\minicurso' : path.join(os.homedir(), 'minicurso')
  const trabalho = path.join(base, 'workspace')

  console.log(`\nIFlow: ${AQUI}`)
  console.log(`Pasta de trabalho: ${trabalho}`)

  passo('Criando a pasta de trabalho')
  fs.mkdirSync(trabalho, { recursive: true })
  ok(trabalho)

  passo('Copiando o projeto de exemplo')
  const exemplo = path.join(AQUI, 'projeto-exemplo')
  if (fs.existsSync(exemplo)) {
    ok(`${copiarPasta(exemplo, trabalho)} arquivos`)
  } else {
    aviso('projeto-exemplo não veio no zip; a demonstração vai precisar de outro projeto')
  }

  passo('Apontando o orquestrador para a pasta de trabalho')
  if (ehWindows) {
    // setx grava no perfil do usuário: vale para toda sessão futura, não para esta.
    for (const [nome, valor] of [
      ['AGENT_ORCHESTRATOR_TERMINAL_CWD', trabalho],
      ['AGENT_ORCHESTRATOR_WATCH_DIR', trabalho]
    ]) {
      const r = spawnSync('setx', [nome, valor], { encoding: 'utf8' })
      if (r.status === 0) ok(`${nome}`)
      else aviso(`não consegui gravar ${nome}: ${(r.stderr || '').trim()}`)
    }
  } else {
    aviso('fora do Windows: exporte AGENT_ORCHESTRATOR_TERMINAL_CWD e _WATCH_DIR na mão')
  }

  passo('Criando o atalho')
  if (ehWindows) criarAtalho(exe, trabalho)
  else aviso('fora do Windows: atalho não criado')

  console.log(`
------------------------------------------------------------
Máquina pronta. Falta o que só dá para fazer na mão:

  1. Abra um terminal NOVO (as variáveis só valem em sessão nova).

  2. Instale a CLI de IA, se ainda não estiver:
       irm https://antigravity.google/cli/install.ps1 | iex

  3. Rode a CLI uma vez, DENTRO de ${trabalho}:
       cd ${trabalho}
       agy
     Responda o assistente de primeiro uso e faça login.

     ISSO É OBRIGATÓRIO. Enquanto esse pedido está na tela, o agente não
     lê o prompt inicial, não termina turno, e o orquestrador não roteia
     nada — parecendo um defeito do app.

  4. Abra o atalho "IFlow" na área de trabalho.
     No primeiro clique o Windows avisa que o autor é desconhecido
     (o executável não é assinado): Mais informações > Executar assim mesmo.

  5. Teste: crie um terminal sem IA e digite  dir
------------------------------------------------------------
`)
}

main()
