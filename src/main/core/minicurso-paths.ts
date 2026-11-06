import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

/**
 * Pastas do minicurso sem variável de ambiente.
 *
 * No laboratório ninguém consegue rodar `setx /M` (não há acesso de
 * administrador, e o Deep Freeze desfaria). Então o app instalado procura a
 * estrutura do pacote sozinho:
 *
 *   C:\minicurso\
 *   ├── iFlow\    (este executável)
 *   ├── virta\    pasta de trabalho dos terminais e dos documentos
 *   └── skills\   skills oferecidas no seletor
 *
 * Primeiro a pasta acima do executável (vale se o pacote for extraído em outro
 * disco), depois o caminho fixo C:\minicurso. Só no app empacotado: em
 * `npm run dev` o comportamento continua o de antes.
 */
const RAIZ_FIXA = 'C:\\minicurso'

function ehPasta(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

export function minicursoDir(nome: 'skills' | 'virta'): string | null {
  if (!app.isPackaged) return null
  const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'))
  for (const raiz of [path.dirname(exeDir), RAIZ_FIXA]) {
    const dir = path.join(raiz, nome)
    if (ehPasta(dir)) return dir
  }
  return null
}

/**
 * Pastas onde os instaladores oficiais põem as CLIs. Entram no PATH dos
 * terminais para o agente ser achado mesmo quando o iFlow foi aberto antes da
 * instalação (o PATH novo só vale para processos abertos depois) ou quando o
 * instalador não conseguiu gravar no PATH do usuário.
 */
export function pastasDeCli(): string[] {
  const local = process.env.LOCALAPPDATA || ''
  const home = process.env.USERPROFILE || ''
  return [
    local && path.join(local, 'agy', 'bin'),
    home && path.join(home, '.local', 'bin'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'GitHub CLI'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'cmd'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs')
  ].filter((p): p is string => !!p && ehPasta(p))
}
