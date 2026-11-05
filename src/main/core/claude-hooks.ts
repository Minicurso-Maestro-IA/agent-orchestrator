import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

/**
 * Integração com os hooks do Claude Code.
 *
 * O protocolo de orquestração pede ao agente que grave um arquivo de status ao
 * terminar o turno. Funciona, mas depende de obediência: quando o agente
 * esquece, o pipeline não roteia nada e o nó seguinte espera para sempre, sem
 * erro visível.
 *
 * O Claude Code tem um hook `Stop`, disparado quando ele termina de responder.
 * Apontando esse hook para um script nosso, o veredito deixa de depender de
 * obediência e passa a ser mecânico.
 *
 * As configurações vão por `--settings`, por sessão, em vez de mexer no
 * ~/.claude/settings.json do usuário: o app não tem o direito de alterar a
 * configuração global de quem o instalou.
 */

const HOOK_TRACE = 'claude-trace.cjs'

/** Mesma ordem de busca do skill-registry: projeto, app empacotado, lado do exe. */
function candidateScripts(nome: string): string[] {
  return [
    path.join(process.cwd(), 'hooks', nome),
    path.join(app.getAppPath(), 'hooks', nome),
    path.join(path.dirname(app.getPath('exe')), 'hooks', nome)
  ]
}

export function resolveHookScript(nome: string): string | null {
  for (const file of candidateScripts(nome)) {
    try {
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return file
    } catch {
      // caminho inacessível, tenta o próximo
    }
  }
  return null
}

/**
 * Grava o settings.json desta sessão e devolve o caminho, ou null quando o
 * script do hook não foi encontrado — nesse caso o agente sobe sem hook, e o
 * pipeline volta a depender de o agente gravar o status por conta própria.
 */
export function writeClaudeSettings(terminalId: string): string | null {
  // O hook Stop (claude-stop.cjs) NÃO é mais registrado. Ele gravava `approved`
  // sozinho a cada fim de turno sem status — e o pipeline agora tem turnos que
  // terminam sem status de propósito: o "Pronto. Aguardando a tarefa." do
  // primeiro prompt, e o agente que para para perguntar algo à pessoa. Com o
  // hook, os dois viravam aprovação e mandavam trabalho adiante sem resposta.
  // Havia também uma corrida: o watcher apaga o status ao lê-lo, e o hook,
  // rodando depois, achava o arquivo ausente e gravava um segundo `approved`.
  // Sem o hook, o Claude Code depende de obediência ao protocolo, como o agy.
  const trace = resolveHookScript(HOOK_TRACE)

  try {
    const dir = path.join(app.getPath('userData'), 'claude-sessions')
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${terminalId}.settings.json`)

    // Edições de arquivo aceitas sem pergunta, mas só na pasta de trabalho e nas
    // duas pastas do protocolo (status e anúncios), que ficam fora dela. Sem
    // isso, gravar o status pedia confirmação e o pipeline parava esperando um
    // clique. Comandos (Bash) continuam pedindo permissão.
    const pipelineDir = path.join(app.getPath('userData'), 'pipeline-status')
    const settings: {
      hooks: Record<string, unknown[]>
      permissions: { defaultMode: string; additionalDirectories: string[] }
    } = {
      hooks: {},
      permissions: {
        defaultMode: 'acceptEdits',
        additionalDirectories: [pipelineDir, path.join(pipelineDir, 'events')]
      }
    }

    if (trace) {
      settings.hooks.PostToolUse = [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `node ${JSON.stringify(trace)}`,
              timeout: 10
            }
          ]
        }
      ]
    }

    fs.writeFileSync(file, JSON.stringify(settings, null, 2), 'utf8')
    return file
  } catch (err) {
    console.warn('[ClaudeHooks] Falha ao gravar as configurações da sessão:', err)
    return null
  }
}

export function clearClaudeSettings(terminalId: string): void {
  try {
    fs.rmSync(
      path.join(app.getPath('userData'), 'claude-sessions', `${terminalId}.settings.json`),
      { force: true }
    )
  } catch {
    // o arquivo pode nem ter sido criado
  }
}
