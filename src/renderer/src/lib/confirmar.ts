import type { AppNode } from '../store/terminalStore'

/**
 * Confirmação antes de apagar terminal ocupado.
 *
 * Um nó com o agente trabalhando guarda o único registro do turno: a conversa
 * está na tela do PTY, e o que ele ainda não gravou em disco morre junto com o
 * processo. O canvas também não é salvo, então não há como desfazer.
 */

/** Nome curto do nó, na ordem em que o cabeçalho o identifica. */
export function rotuloDoNo(node: AppNode): string {
  const data = node.data as {
    skillName?: string
    agentLabel?: string
    title?: string
    shell?: string
    name?: string
  }
  return data.skillName || data.agentLabel || data.title || data.name || data.shell || node.id
}

/** Terminais cujo agente está trabalhando neste instante. */
export function terminaisOcupados(nodes: AppNode[]): AppNode[] {
  return nodes.filter(
    (n) => n.type === 'terminal' && (n.data as { activity?: string }).activity === 'working'
  )
}

/**
 * Pergunta antes de encerrar terminais ocupados. Devolve true quando pode
 * seguir — inclusive quando não havia nenhum ocupado, que é o caso comum.
 */
export function confirmarEncerrarOcupados(ocupados: AppNode[]): boolean {
  if (ocupados.length === 0) return true

  const lista = ocupados.map((n) => `  • ${rotuloDoNo(n)}`).join('\n')
  const cabecalho =
    ocupados.length === 1
      ? 'Este terminal está trabalhando agora:'
      : `Estes ${ocupados.length} terminais estão trabalhando agora:`

  return window.confirm(
    `${cabecalho}\n\n${lista}\n\n` +
      'Apagar encerra o processo na hora. O que o agente ainda não gravou em disco ' +
      'se perde, e o canvas não guarda histórico para desfazer.\n\n' +
      'Apagar mesmo assim?'
  )
}
