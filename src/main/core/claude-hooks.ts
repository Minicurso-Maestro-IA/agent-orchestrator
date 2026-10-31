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

const HOOK_FILE = 'claude-stop.cjs'

/** Mesma ordem de busca do skill-registry: projeto, app empacotado, lado do exe. */
function candidateScripts(): string[] {
  return [
    path.join(process.cwd(), 'hooks', HOOK_FILE),
    path.join(app.getAppPath(), 'hooks', HOOK_FILE),
    path.join(path.dirname(app.getPath('exe')), 'hooks', HOOK_FILE)
  ]
}

export function resolveHookScript(): string | null {
  for (const file of candidateScripts()) {
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
  const script = resolveHookScript()
  if (!script) {
    console.warn(`[ClaudeHooks] ${HOOK_FILE} não encontrado; o agente sobe sem o hook de status.`)
    return null
  }

  try {
    const dir = path.join(app.getPath('userData'), 'claude-sessions')
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${terminalId}.settings.json`)

    // O hook herda o ambiente do PTY, que já carrega ORCHESTRATOR_STATUS_FILE:
    // é assim que o script sabe onde gravar, sem precisar de argumento.
    const settings = {
      hooks: {
        Stop: [
          {
            hooks: [
              {
                type: 'command',
                command: `node ${JSON.stringify(script)}`,
                timeout: 15
              }
            ]
          }
        ]
      }
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
