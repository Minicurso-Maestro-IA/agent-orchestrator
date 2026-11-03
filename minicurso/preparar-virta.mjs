#!/usr/bin/env node
/**
 * Prepara um projeto local para virar repositório e sobe para o GitHub.
 *
 * Escrito em Node, e não em PowerShell, por dois motivos: roda igual no cmd e no
 * PowerShell, e pôde ser testado de verdade antes de chegar na sua máquina.
 *
 * Uso:
 *   node preparar-virta.mjs <pasta-do-projeto> [url-do-repo]
 *
 * O que ele faz, nesta ordem:
 *   1. garante um .gitignore com node_modules, .env e companhia;
 *   2. `git init` se ainda não for repositório;
 *   3. `git add -A` e **mostra o que vai subir**;
 *   4. **aborta sozinho** se encontrar algo com cara de segredo, ou se o número
 *      de arquivos indicar que node_modules vazou;
 *   5. só então pergunta se pode commitar e dar push.
 *
 * O passo 4 existe porque tirar uma credencial do histórico depois do push é
 * muito mais trabalhoso do que não colocá-la.
 */
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import fs from 'node:fs'
import path from 'node:path'

const REPO_PADRAO = 'https://github.com/Minicurso-Maestro-IA/virta-minicurso.git'

const IGNORAR = [
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  'out/',
  'coverage/',
  '.idea/',
  '.vscode/',
  '.env',
  '.env.*',
  '!.env.example',
  '*.log',
  '.DS_Store',
  'Thumbs.db'
]

/** Nomes que não devem ir para um repositório novo. */
const PADRAO_SEGREDO =
  /(^|\/)\.env($|\.)|secret|credential|senha|(^|\/)id_rsa|\.pem$|\.key$|\.pfx$|\.p12$|serviceaccount.*\.json$/i

/** Acima disso, quase certamente node_modules ou build entrou junto. */
const LIMITE_ARQUIVOS = 20000

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (r.error) throw new Error(`git não encontrado no PATH: ${r.error.message}`)
  return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() }
}

function gitOuFalha(args, cwd, oQue) {
  const r = git(args, cwd)
  if (r.code !== 0) {
    console.error(`\n✖ Falhou ao ${oQue}:\n${r.err || r.out}`)
    process.exit(1)
  }
  return r
}

function garantirGitignore(projeto) {
  const arquivo = path.join(projeto, '.gitignore')
  const atual = fs.existsSync(arquivo) ? fs.readFileSync(arquivo, 'utf8') : ''
  const linhas = new Set(atual.split(/\r?\n/).map((l) => l.trim()))
  const faltando = IGNORAR.filter((l) => !linhas.has(l))

  if (faltando.length === 0) {
    console.log('  .gitignore já cobre o necessário')
    return
  }

  // Acrescenta sem apagar o que já existe: o projeto pode ter regras próprias.
  const prefixo = atual && !atual.endsWith('\n') ? '\n' : ''
  const bloco = `${prefixo}\n# acrescentado por preparar-virta.mjs\n${faltando.join('\n')}\n`
  fs.writeFileSync(arquivo, atual + bloco, 'utf8')
  console.log(`  .gitignore: ${faltando.length} regras acrescentadas`)
}

function resumoPorPasta(arquivos) {
  const contagem = new Map()
  for (const a of arquivos) {
    const topo = a.split('/')[0] || a
    contagem.set(topo, (contagem.get(topo) ?? 0) + 1)
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
}

async function main() {
  const projeto = process.argv[2]
  const repo = process.argv[3] || REPO_PADRAO

  if (!projeto) {
    console.error('Uso: node preparar-virta.mjs <pasta-do-projeto> [url-do-repo]')
    process.exit(1)
  }
  if (!fs.existsSync(projeto) || !fs.statSync(projeto).isDirectory()) {
    console.error(`✖ Pasta não encontrada: ${projeto}`)
    process.exit(1)
  }

  console.log(`\nProjeto: ${projeto}`)
  console.log(`Destino: ${repo}\n`)

  console.log('1. .gitignore')
  garantirGitignore(projeto)

  console.log('\n2. Repositório')
  if (fs.existsSync(path.join(projeto, '.git'))) {
    console.log('  já é um repositório git')
  } else {
    gitOuFalha(['init'], projeto, 'rodar git init')
    console.log('  git init feito')
  }

  console.log('\n3. Preparando os arquivos')
  gitOuFalha(['add', '-A'], projeto, 'rodar git add')
  const lista = git(['diff', '--cached', '--name-only'], projeto).out
  const arquivos = lista ? lista.split('\n').filter(Boolean) : []

  // Nada novo para commitar não quer dizer nada a fazer: rodar o script de novo
  // depois de um push que falhou tem que conseguir só repetir o push.
  const jaTemCommit = git(['rev-parse', '--verify', 'HEAD'], projeto).code === 0
  if (arquivos.length === 0) {
    if (!jaTemCommit) {
      console.log('\n✖ Nada para enviar: ou a pasta está vazia, ou tudo nela está ignorado.')
      process.exit(1)
    }
    console.log('  nada novo desde o último commit; vou direto para o envio')
    await enviar(projeto, repo, true)
    return
  }

  console.log(`  ${arquivos.length} arquivos\n`)
  console.log('   Por pasta:')
  for (const [pasta, qtd] of resumoPorPasta(arquivos)) {
    console.log(`     ${String(qtd).padStart(6)}  ${pasta}`)
  }

  console.log('\n4. Subprojetos com git próprio')
  // Uma pasta que já é repositório git entra no índice como ponteiro de
  // submódulo (modo 160000), e não como os arquivos dela. O push sobe um
  // repositório sem uma linha de código, e a contagem de arquivos não denuncia:
  // cada subprojeto aparece como 1.
  const indice = git(['ls-files', '-s'], projeto).out
  const submodulos = indice
    .split('\n')
    .filter((l) => l.startsWith('160000'))
    .map((l) => l.split('\t')[1])
    .filter(Boolean)

  if (submodulos.length > 0) {
    console.error('\n✖ ABORTADO: estas pastas já são repositórios git próprios:\n')
    for (const s of submodulos) console.error(`     ${s}`)
    console.error(
      '\n  O git registra cada uma como um ponteiro, não como os arquivos dentro dela.' +
        '\n  Enviar assim produz um repositório sem nenhuma linha de código.' +
        '\n' +
        '\n  Duas saídas:' +
        '\n    1. rode este script uma vez para CADA subprojeto, com uma URL de repositório' +
        '\n       diferente em cada — aí cada um vira um repositório de verdade;' +
        '\n    2. ou, se o objetivo é só me passar o código para leitura, zipe as pastas' +
        '\n       `src` e anexe no chat: não mexe na estrutura que já existe.' +
        '\n' +
        '\n  Nada foi commitado nem enviado.'
    )
    process.exit(2)
  }
  console.log('  nenhum: todas as pastas entram como arquivos')

  console.log('\n5. Checagem de segurança')
  const suspeitos = arquivos.filter((a) => PADRAO_SEGREDO.test(a))

  if (suspeitos.length > 0) {
    console.error('\n✖ ABORTADO: há arquivos com cara de segredo na lista.\n')
    for (const s of suspeitos.slice(0, 20)) console.error(`     ${s}`)
    if (suspeitos.length > 20) console.error(`     ... e mais ${suspeitos.length - 20}`)
    console.error(
      '\n  Nada foi commitado nem enviado. Acrescente esses caminhos ao .gitignore,' +
        '\n  rode `git rm --cached <arquivo>` para cada um, e execute este script de novo.' +
        '\n  Tirar credencial do histórico depois do push é bem mais trabalhoso.'
    )
    process.exit(2)
  }
  console.log('  nenhum arquivo suspeito')

  if (arquivos.length > LIMITE_ARQUIVOS) {
    console.error(
      `\n✖ ABORTADO: ${arquivos.length} arquivos é muito.` +
        '\n  Quase certamente node_modules ou uma pasta de build entrou junto.' +
        '\n  Confira a lista por pasta acima. Nada foi commitado nem enviado.'
    )
    process.exit(2)
  }
  console.log(`  ${arquivos.length} arquivos está dentro do esperado`)

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const resposta = (await rl.question('\nCommitar e enviar para o GitHub? (s/n) ')).trim().toLowerCase()
  rl.close()

  if (resposta !== 's' && resposta !== 'sim') {
    console.log('\nNada foi enviado. Os arquivos ficaram preparados (git add feito).')
    process.exit(0)
  }

  await enviar(projeto, repo, false, jaTemCommit)
}

/** Commit (quando há o que commitar), remote e push, com erro explicado. */
async function enviar(projeto, repo, semNovidade, jaTemCommit = true) {
  console.log('\n6. Enviando')

  if (!semNovidade) {
    gitOuFalha(
      ['commit', '-m', jaTemCommit ? 'Atualiza snapshot para o minicurso' : 'Snapshot do virta para o minicurso'],
      projeto,
      'criar o commit'
    )
    console.log('  commit criado')
  }

  gitOuFalha(['branch', '-M', 'main'], projeto, 'renomear a branch para main')

  // `remote add` falha se já existe; set-url resolve os dois casos.
  if (git(['remote', 'get-url', 'origin'], projeto).code === 0) {
    gitOuFalha(['remote', 'set-url', 'origin', repo], projeto, 'apontar o remote origin')
    console.log('  remote origin atualizado')
  } else {
    gitOuFalha(['remote', 'add', 'origin', repo], projeto, 'adicionar o remote origin')
    console.log('  remote origin adicionado')
  }

  const push = git(['push', '-u', 'origin', 'main'], projeto)
  if (push.code !== 0) {
    const motivo = `${push.err}\n${push.out}`
    console.error(`\n✖ O push falhou:\n${push.err || push.out}`)

    // O caso mais comum: o repositório foi criado no GitHub já com um README,
    // então o remoto tem um commit que o local não conhece.
    if (/rejected|non-fast-forward|fetch first|behind/i.test(motivo)) {
      console.error(
        '\n  O repositório no GitHub já tem algum commit (um README criado junto com ele,' +
          '\n  quase sempre). Junte os dois históricos e envie de novo:' +
          '\n' +
          `\n    git -C "${projeto}" pull --rebase origin main` +
          `\n    git -C "${projeto}" push -u origin main`
      )
    } else if (/authentication|denied|403|could not read Username|credential/i.test(motivo)) {
      console.error(
        '\n  É autenticação. Faça login no git (ou no GitHub CLI, com `gh auth login`) e rode:' +
          `\n    git -C "${projeto}" push -u origin main`
      )
    } else if (/not found|repository.*does not exist|404/i.test(motivo)) {
      console.error(
        '\n  O repositório não existe no GitHub ainda, ou a URL está errada.' +
          '\n  Crie-o vazio (sem README) e rode este script de novo.'
      )
    } else {
      console.error(
        `\n  Nada se perdeu: o commit está feito. Depois de resolver, rode:` +
          `\n    git -C "${projeto}" push -u origin main`
      )
    }
    process.exit(1)
  }

  console.log('\n✓ Enviado. Agora é só me avisar que eu anexo o repositório e leio o código.')
}

main().catch((e) => {
  console.error(`\n✖ ${e.message}`)
  process.exit(1)
})
