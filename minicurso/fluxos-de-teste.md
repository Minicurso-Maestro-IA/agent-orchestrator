# Fluxos de teste

Nove fluxos, do mais simples ao mais completo, cada um isolando **uma** peça. A
ordem importa: se o fluxo 1 falha, não faz sentido investigar o 6, porque todos
dependem dele.

Os fluxos 5 a 7 servem duas vezes: como teste seu e como exercício da turma.

---

## Antes de começar

Sem isso, todo fluxo com IA falha — e falha de um jeito que parece bug do app:

1. **Pasta de trabalho.** `C:\minicurso\workspace`, criada pelo
   `preparar-maquina.ps1`, que também aponta `AGENT_ORCHESTRATOR_TERMINAL_CWD`
   e `AGENT_ORCHESTRATOR_WATCH_DIR` para ela.
2. **Primeiro uso de cada CLI, na mão, dentro daquela pasta.** Rode `agy` e, se
   for usar, `claude`. Responda o assistente de primeiro uso e faça login.
   Enquanto esse pedido está na tela, o agente não lê o prompt inicial, não
   termina turno e **nada roteia**. É a causa número um de "não funcionou".
3. **Uma instância só.** O app recusa a segunda, mas confirme que não há outra
   janela aberta de uma tentativa anterior.
4. **Arquivos de exercício.** Deixe na pasta um `cobranca.js` com um bug óbvio
   (uma divisão sem checar zero serve) — os fluxos 5 e 6 usam isso.

---

## Fluxo 0 — Terminal puro, sem IA

**Prova:** o empacotamento. Se isso falha, o node-pty ou a `conpty.dll` não
sobreviveram ao zip, e nada mais vai funcionar.

1. Abra o app.
2. Crie um terminal escolhendo **só o shell**, sem IA e sem skill.
3. Digite `dir` e Enter.

**Esperado:** a listagem da pasta, com as linhas quebrando no lugar certo.
Redimensione o nó e rode `dir` de novo: continua certo (prova que cols/rows
chegam ao PTY).

**Se falhar:** copie o que aparece dentro do nó. Erro de módulo nativo aqui é
empacotamento, não configuração.

---

## Fluxo 1 — Um agente com skill

**Prova:** a entrega do contexto por arquivo (`{promptFile}`).

1. Na barra de cima, escolha **IA: Antigravity** (ou Claude Code) e
   **Skill: Code Review**.
2. Crie o terminal.

**Esperado:**
- a CLI sobe e **já começa a trabalhar**, sem aquela pausa de 4 segundos que
  existia quando o app colava o texto às cegas;
- a bolinha do cabeçalho fica **âmbar, pulsando** ("trabalhando") e volta a
  **verde** ("ocioso") quando ele termina.

**Se falhar:** se a CLI subir e ficar parada esperando, você caiu no item 2 do
"antes de começar". Se aparecer `▸ Hook de status indisponível`, a pasta `hooks/`
não veio no zip.

---

## Fluxo 2 — O rastro de ações (é isto que a turma vê)

**Prova:** o hook `PostToolUse`. **Só funciona com Claude Code** — é a única CLI
do catálogo com hooks.

1. Crie um terminal com **Claude Code**, sem skill.
2. Peça: `Leia o cobranca.js e me diga em uma linha o que ele faz.`

**Esperado:** aparece uma faixa entre o cabeçalho e o terminal:

```
▸ leu cobranca.js                                    1 ações
```

3. Agora peça: `Crie um arquivo notas.md com um resumo, e rode dir.`

**Esperado:** a faixa acompanha — `escreveu notas.md`, `rodou dir` — e o contador
sobe. Clique na faixa: ela abre e mostra as últimas 8 ações, da mais recente para
a mais antiga, cada uma com seu ícone.

**Por que isso importa para a aula:** o aluno entende em dois segundos o que
aquela IA está fazendo, sem ler a prosa do terminal rolando. Com dois ou três nós
na tela, dá para ver quem está lendo, quem está escrevendo e quem está rodando
teste, ao mesmo tempo.

**Se a faixa não aparecer:** confirme que o agente é o Claude Code. Com Antigravity
ela fica vazia por projeto, não por bug.

---

## Fluxo 3 — Veredito automático

**Prova:** o hook `Stop`. É o que impede o pipeline de travar em silêncio.

1. Terminal com **Claude Code**, sem skill.
2. Peça algo trivial e **não mencione status nenhum**:
   `Responda apenas: pronto.`

**Esperado:** ao fim do turno, aparece no terminal

```
▸ APROVADO (automático: o agente encerrou sem gravar o status): pronto
```

Essa palavra **automático** é o ponto do teste: o agente não gravou nada, e o
pipeline tem um veredito de qualquer forma.

---

## Fluxo 4 — Veredito explícito vence o automático

**Prova:** que o hook não atropela a decisão do agente.

1. Terminal com **Claude Code** e a skill **Code Review**.
2. Peça: `Revise o cobranca.js. Ele tem um bug; reprove.`

**Esperado:** `▸ REPROVADO: <motivo>`, **sem** a palavra "automático". Se vier
"automático", o agente não gravou o arquivo e o hook decidiu por ele — anote e me
mande, porque aí o texto do protocolo precisa de ajuste.

---

## Fluxo 5 — O pipeline clássico: codifica → revisa

**Prova:** o roteamento por aresta. É o fluxo que vale demonstrar na aula.

1. Crie o terminal **A**, com Claude Code e sem skill. Renomeie mentalmente:
   é o autor.
2. Crie o terminal **B**, com Claude Code e a skill **Code Review**.
3. Ligue **A → B** arrastando de um pino de A até B.
4. Clique no rótulo da aresta até ele dizer **`sempre`**.
5. Ligue **B → A** e clique no rótulo dessa até dizer **`reprovado`**.
6. Em A, peça: `Corrija o bug de divisão por zero no cobranca.js.`

**Esperado, em ordem:**
- A trabalha (bolinha âmbar, faixa mostrando `leu`/`editou cobranca.js`);
- A termina → `▸ APROVADO` em A;
- **B recebe sozinho**: `▸ Recebido de "<título de A>" (sempre)` e começa a
  trabalhar;
- se B reprovar, A recebe de volta: `▸ Recebido de "<B>" (reprovado)` com o
  motivo, e corrige.

Isso roda **sem você no meio**. É o momento da aula em que a ficha cai.

**Se B não receber nada:** veja se A terminou com veredito (fluxo 3) e se a
aresta está com a condição certa. Aresta `aprovado` não dispara em reprovação.

---

## Fluxo 6 — Agente cria agente

**Prova:** o canal de spawn.

1. Terminal com **Claude Code**.
2. Peça: `Divida este trabalho: crie um agente chamado "Testes" e peça a ele
   para escrever os testes do cobranca.js. Você cuida da correção.`

**Esperado:** um nó novo aparece **à direita**, já **ligado** ao primeiro, com o
título "Testes", e começa a trabalhar com a tarefa já entregue. No terminal de
quem pediu: `▸ Agente "Testes" criado e ligado a você.`

**Se não aparecer:** o agente pode ter usado o mecanismo interno de subagente dele
em vez do nosso canal — nesse caso o trabalho acontece escondido, fora do canvas.
Anote o que ele respondeu; é sinal de que o texto do protocolo precisa ser mais
explícito.

---

## Fluxo 7 — Documento no canvas

**Prova:** o anúncio de documento e a injeção de contexto.

1. Terminal com **Claude Code**.
2. Peça: `Crie um regras.md com 3 regras de nomenclatura e anuncie esse
   documento no canvas.`

**Esperado:** um nó de documento aparece com o conteúdo do arquivo.

3. Edite o `regras.md` fora do app, num editor, e salve.

**Esperado:** o nó atualiza sozinho (o observador de disco atualiza conteúdo, mas
nunca cria nó — por isso o passo 2 precisa do anúncio).

4. Ligue o nó de documento a um terminal de agente.

**Esperado:** `▸ Documento "regras.md" carregado como contexto`.

---

## Fluxo 8 — Os freios

**Prova:** que nada roda sem limite queimando cota.

1. **Laço de pipeline:** monte A → B com `sempre` nas duas direções (A → B e
   B → A) e dispare. Depois de 20 saltos: `▸ Pipeline pausado: limite de 20
   saltos atingido`, e o botão **Retomar** aparece na barra.
2. **Spawn em cascata:** peça a um agente para criar vários agentes em sequência.
   No nono: `▸ Pedido de agente recusado: limite de 8 agentes criados por agentes
   nesta sessão.`
3. **Instância dupla:** com o app aberto, clique no atalho de novo. **Esperado:**
   nenhuma janela nova; a existente vem para a frente.

O terceiro é o mais importante dos três e o menos óbvio: duas instâncias
compartilham a mesma pasta de eventos e **consomem o arquivo uma da outra**, então
vereditos roteiam no canvas errado ou desaparecem.

---

## O que anotar quando algo falhar

Para eu conseguir corrigir sem adivinhar:

1. **Em qual fluxo e em qual passo** parou.
2. **O que apareceu dentro do nó de terminal** — é onde o app escreve os avisos
   com `▸`, e eles dizem quase sempre o que faltou.
3. **Qual CLI** estava no nó. O Claude Code tem hooks; o Antigravity não, então
   rastro e veredito automático não valem para ele.
4. Se foi algo que **não apareceu** (um nó, uma faixa, um veredito), diga quanto
   tempo você esperou. Vários desses caminhos têm polling de 400 a 500 ms, mas um
   turno de agente leva minutos.
