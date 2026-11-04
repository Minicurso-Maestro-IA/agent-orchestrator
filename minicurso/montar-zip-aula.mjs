#!/usr/bin/env node
/**
 * Monta o zip único da aula: o IFlow empacotado + o código do virta.
 *
 *   node minicurso/montar-zip-aula.mjs
 *   node minicurso/montar-zip-aula.mjs --virta C:\caminho\do\virta-minicurso
 *
 * Rode DEPOIS de `npm run dist:win`, a partir da raiz do repositório. No
 * Windows o build grava o ícone e os metadados dentro do .exe; num build feito
 * em Linux isso não acontece (precisa do rcedit, que é um binário Windows), e o
 * executável sai com o ícone genérico do Electron. Funciona igual — só é feio e
 * ajuda menos no aviso do SmartScreen.
 *
 * Sem o virta à mão, ele clona do GitHub.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EMPACOTADO = path.join(RAIZ, 'release', 'win-unpacked')
const REPO_VIRTA = 'https://github.com/Minicurso-Maestro-IA/virta-minicurso.git'
const IGNORAR = new Set(['node_modules', '.git', 'dist', '.vite', 'build', 'release'])

const passo = (t) => console.log(`\n==> ${t}`)
const ok = (t) => console.log(`    OK  ${t}`)
const erro = (t) => { console.error(`\n✖ ${t}\n`); process.exit(1) }

const opcao = (nome) => {
  const i = process.argv.indexOf(`--${nome}`)
  return i >= 0 ? process.argv[i + 1] : null
}

function copiar(de, para) {
  fs.mkdirSync(para, { recursive: true })
  let total = 0
  for (const item of fs.readdirSync(de, { withFileTypes: true })) {
    if (IGNORAR.has(item.name)) continue
    const origem = path.join(de, item.name)
    const destino = path.join(para, item.name)
    if (item.isDirectory()) {
      fs.mkdirSync(destino, { recursive: true })
      total += copiar(origem, destino)
    } else {
      fs.copyFileSync(origem, destino)
      total++
    }
  }
  return total
}

/** Compacta com a ferramenta nativa de cada sistema: nada a instalar. */
function compactar(pasta, destino) {
  fs.rmSync(destino, { force: true })
  if (process.platform === 'win32') {
    const r = spawnSync('powershell', ['-NoProfile', '-Command',
      `Compress-Archive -Path ${JSON.stringify(pasta + '\\*')} -DestinationPath ${JSON.stringify(destino)} -CompressionLevel Optimal`
    ], { stdio: 'inherit' })
    return r.status === 0
  }
  const r = spawnSync('zip', ['-rq', destino, '.'], { cwd: pasta, stdio: 'inherit' })
  return r.status === 0
}

function main() {
  if (!fs.existsSync(path.join(EMPACOTADO, 'IFlow.exe'))) {
    erro(`Não achei ${path.join(EMPACOTADO, 'IFlow.exe')}.\n  Rode antes:  npm run dist:win`)
  }

  const saida = path.join(RAIZ, 'release', 'aula')
  fs.rmSync(saida, { recursive: true, force: true })
  fs.mkdirSync(saida, { recursive: true })

  passo('Copiando o IFlow empacotado')
  ok(`${copiar(EMPACOTADO, path.join(saida, 'IFlow'))} arquivos`)

  passo('Copiando o código do virta')
  let virta = opcao('virta')
  if (!virta) {
    const temporario = path.join(os.tmpdir(), `virta-${Date.now()}`)
    console.log(`    clonando ${REPO_VIRTA}`)
    const r = spawnSync('git', ['clone', '--depth', '1', '-q', REPO_VIRTA, temporario], { stdio: 'inherit' })
    if (r.status !== 0) erro('git clone falhou. Passe --virta <pasta> com uma cópia local.')
    virta = temporario
  }
  if (!fs.existsSync(path.join(virta, 'package.json'))) erro(`Não parece o virta: ${virta}`)
  ok(`${copiar(virta, path.join(saida, 'virta'))} arquivos`)

  passo('Escrevendo o LEIA-ME')
  fs.writeFileSync(path.join(saida, 'LEIA-ME.txt'), `IFlow + virta - minicurso de IA generativa
================================================================

O QUE TEM AQUI

  IFlow\\      o orquestrador de agentes, ja compilado (nao precisa instalar)
  virta\\      o projeto que os alunos vao consertar, com os defeitos plantados

INSTALANDO NUMA MAQUINA DO LABORATORIO

  1. Clique com o botao direito NESTE ZIP, Propriedades, e marque "Desbloquear"
     ANTES de extrair. O Windows carimba tudo que vem da internet, e o carimbo
     passa para cada arquivo extraido - e o que faz o aviso de seguranca
     aparecer toda vez.

  2. Extraia a pasta inteira em C:\\minicurso

  3. Abra C:\\minicurso\\IFlow e rode:  node instalar.mjs

  4. Instale a CLI de IA (uma vez por maquina):
       irm https://antigravity.google/cli/install.ps1 | iex
     Depois abra um terminal NOVO e rode 'agy' uma vez para fazer o login.

  5. Abra o IFlow.exe. Na primeira vez o Windows avisa que o autor e
     desconhecido: Mais informacoes > Executar assim mesmo.

     Isso acontece porque o executavel nao e assinado digitalmente. Assinatura
     custa dinheiro e exige uma empresa; para uma aula, o aviso e esperado.

RODANDO O VIRTA

  cd C:\\minicurso\\virta
  npm install
  npm run dev

  Entrar com:  maria@virta.com  /  123456
  Nao precisa de backend, banco nem Java: o servidor e simulado no navegador.

  A versao publicada, para quem so quer ver:
  https://minicurso-maestro-ia.github.io/virta-minicurso/

AS TAREFAS

  https://github.com/Minicurso-Maestro-IA/virta-minicurso/issues
`, 'utf8')
  ok('LEIA-ME.txt')

  passo('Compactando')
  const zip = path.join(RAIZ, 'release', 'iflow-virta-minicurso.zip')
  if (!compactar(saida, zip)) erro('a compactacao falhou')
  const mb = (fs.statSync(zip).size / 1048576).toFixed(0)
  ok(`${zip}  (${mb} MB)`)

  console.log(`\nPronto. Mande este arquivo:\n  ${zip}\n`)
}

main()
