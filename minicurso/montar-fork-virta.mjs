#!/usr/bin/env node
/**
 * Monta o fork do virta para a aula, em um comando.
 *
 *   node montar-fork-virta.mjs <pasta-do-virta-front-end> [pasta-de-destino]
 *
 * Copia o projeto para a pasta de trabalho do aluno, sobrescreve os três
 * arquivos com os defeitos plantados e confere que cada defeito está de fato no
 * lugar — copiar sem conferir é como a gente descobre na aula que faltou um.
 *
 * O projeto original não é tocado em momento nenhum.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const ORIGEM_FORK = path.join(AQUI, 'fork-virta', 'front', 'src')
const DESTINO_PADRAO = 'C:\\minicurso\\workspace\\virta-front-end'

/** Cada arquivo e a marca que prova que o defeito entrou. */
const ARQUIVOS = [
  {
    rel: path.join('components', 'CategoryBadge.tsx'),
    marca: '"#71717a" ?? color',
    defeito: 'toda etiqueta de categoria cinza'
  },
  {
    rel: path.join('components', 'wallet', 'WalletTransactions.tsx'),
    marca: '{income ? "-" : "+"}',
    defeito: 'sinal invertido, cor única, data e valor crus, texto sem corte'
  },
  {
    rel: path.join('pages', 'DashboardPage.tsx'),
    marca: 'const INCOME_COLOR = "#ef4444"',
    defeito: 'cores de receita e despesa trocadas nos gráficos'
  }
]

const ok = (t) => console.log(`    OK  ${t}`)
const passo = (t) => console.log(`\n==> ${t}`)

/** Copia recursivamente, pulando o que não interessa num fork de aula. */
function copiar(de, para) {
  const PULAR = new Set(['node_modules', 'dist', '.git', '.vite', 'build'])
  let total = 0
  for (const item of fs.readdirSync(de, { withFileTypes: true })) {
    if (PULAR.has(item.name)) continue
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

function main() {
  const virta = process.argv[2]
  const destino = process.argv[3] || DESTINO_PADRAO

  if (!virta) {
    console.error('Uso: node montar-fork-virta.mjs <pasta-do-virta-front-end> [destino]')
    process.exit(1)
  }
  if (!fs.existsSync(path.join(virta, 'src'))) {
    console.error(`✖ Não parece o virta-front-end: não achei "src" em ${virta}`)
    process.exit(1)
  }
  if (!fs.existsSync(ORIGEM_FORK)) {
    console.error(`✖ Não achei os arquivos do fork em ${ORIGEM_FORK}. Rode um "git pull" no repositório.`)
    process.exit(1)
  }
  if (path.resolve(virta) === path.resolve(destino)) {
    console.error('✖ Origem e destino são a mesma pasta. O fork tem que ser uma cópia.')
    process.exit(1)
  }

  console.log(`\nOrigem : ${virta}`)
  console.log(`Destino: ${destino}`)

  passo('Copiando o projeto (o original não é tocado)')
  if (fs.existsSync(destino)) {
    console.log('    aviso: destino já existe; os arquivos serão sobrescritos')
  }
  fs.mkdirSync(destino, { recursive: true })
  ok(`${copiar(virta, destino)} arquivos copiados`)

  passo('Plantando os defeitos')
  for (const { rel, defeito } of ARQUIVOS) {
    const de = path.join(ORIGEM_FORK, rel)
    const para = path.join(destino, 'src', rel)
    if (!fs.existsSync(de)) {
      console.error(`✖ Faltando no repositório: ${de}`)
      process.exit(1)
    }
    fs.mkdirSync(path.dirname(para), { recursive: true })
    fs.copyFileSync(de, para)
    ok(`${rel}  —  ${defeito}`)
  }

  passo('Conferindo que cada defeito entrou')
  let falhou = false
  for (const { rel, marca } of ARQUIVOS) {
    const conteudo = fs.readFileSync(path.join(destino, 'src', rel), 'utf8')
    if (conteudo.includes(marca)) {
      ok(rel)
    } else {
      console.error(`    ✖ ${rel}: não encontrei a marca do defeito`)
      falhou = true
    }
  }
  if (falhou) process.exit(1)

  console.log(`
------------------------------------------------------------
Fork montado. Agora:

  cd "${destino}"
  npm install
  npm run dev

Com o backend do virta no ar, crie TRÊS transações para ver os seis
defeitos de uma vez:
  1. uma receita;
  2. uma despesa;
  3. uma com descrição bem longa (umas 20 palavras).

Para as tarefas aparecerem no seletor do orquestrador:
  setx AGENT_ORCHESTRATOR_SKILLS_DIR ${path.join(AQUI, 'skills-virta')}
(e abra o app numa janela nova)
------------------------------------------------------------
`)
}

main()
