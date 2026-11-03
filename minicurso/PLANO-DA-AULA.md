# Plano da aula

Transcrito do áudio e organizado em blocos de tempo, com o que precisa estar
pronto antes de cada um.

**Duração prevista:** 1h30 a 2h.

---

## A ideia central

Não é "ver a IA programar". É **escrever para a IA** e depois **conviver com o
que ela entregou**.

Por isso a mecânica da rotação: cada grupo escreve uma tarefa e executa a tarefa
de outro grupo. Quem escreveu mal descobre na hora, porque **outra pessoa** sofre
com o texto dele — e isso ensina mais do que qualquer slide sobre "como escrever
bons prompts".

---

## Blocos

### 1. O que é IA generativa — 30 min

Apresentação. Como funciona, o que faz, o que não faz.

### 2. O orquestrador, ao vivo — dentro dos 30 min

Mostrar o app funcionando. Criar um terminal, escolher a IA, ver a faixa de
ações mostrando o que o agente faz em tempo real.

### 3. Demonstração do fluxo completo — ~10 min

Um problema pequeno, resolvido na frente da turma, nos três passos:

1. **resolver** — pedir o algoritmo;
2. **testar** — pedir os testes;
3. **revisar** — segundo agente revisando o primeiro.

É aqui que o canvas justifica a existência: ligue os dois nós, `aprovado` segue,
`reprovado` volta, e **deixe rodar sem tocar**.

> Use o `projeto-exemplo` (`back/` roda com `node server.js`, sem instalar nada)
> — é pequeno e previsível, bom para demonstração ao vivo.

### 4. Setup da turma — 20 min

Criar contas, entrar no projeto, abrir o fork.

**Este é o bloco que mais costuma estourar.** Ver a seção de riscos.

### 5. Os problemas no fork do virta — apresentação rápida

O fork tem bugs plantados, com peso em **defeito visual**:

| Já plantado | Onde |
|---|---|
| Despesa aparece com `+` e em verde | lista de transações |
| Data crua (`2026-01-15`) e valor cru (`1234.5`) | lista de transações |
| Descrição longa empurra valor e botões para fora | lista de transações |
| Toda categoria cinza | etiquetas |
| Gráficos com receita em vermelho | dashboard |
| Filtro de Receitas/Despesas não filtra | backend |
| Filtrar por categoria mostra todas as outras | backend |

Além dos bugs, a turma pode propor **melhorias livres** — do tipo "queria criar a
categoria na hora do lançamento". Vale tanto quanto bug, e às vezes rende
discussão melhor.

### 6. Grupos e rotação — ~60 min

Quatro grupos de quatro ou cinco pessoas.

**Rodada 1 — escrever (15 min).** Cada grupo escolhe um problema e **escreve a
tarefa** para a IA resolver. Usa o modelo de `COMO-ESCREVER-UMA-TAREFA.md`.

**Rodada 2 — executar (45 min).** Cada grupo recebe a tarefa de outro:

```
grupo 1 → executa a do grupo 2
grupo 2 → executa a do grupo 3
grupo 3 → executa a do grupo 4
grupo 4 → executa a do grupo 1
```

Ninguém executa a própria tarefa. Se o texto estava vago, **quem sofre é outro
grupo** — e é exatamente esse atrito que ensina.

Durante a rodada, circular ajudando: como pedir, como ler o diff, quando parar de
insistir com o agente e pensar sozinho.

### 7. O intervalo com a IA trabalhando

Deixar os pipelines rodando: codifica → revisa, sem ninguém no meio.

⚠️ **Isso só funciona se os agentes estiverem sem pedido de confirmação.** Um
agente que para perguntando "posso escrever o arquivo?" fica parado o intervalo
inteiro. Ver riscos.

### 8. Revisão final, com pensamento crítico — ~20 min

O melhor momento da aula. Olhar o que saiu, **com a IA e contra ela**.

O exemplo do áudio é perfeito e vale ser o primeiro:

> A IA aceitou cadastrar um valor negativo. Mas faz sentido valor negativo, se o
> sistema já tem despesa e receita separadas? A IA permitiu. Ninguém perguntou.

Perguntas para a turma, olhando cada entrega:

1. **A IA fez o que foi pedido, ou o que dava para entender do que foi pedido?**
2. **O que ela aceitou que não deveria?** Valor negativo, data no futuro, campo
   vazio, categoria de outra carteira.
3. **O que ela mexeu além do pedido?**
4. **Se a tarefa estava mal escrita, dá para ver isso no resultado?**

O fechamento é esse: a IA faz o que você pediu. O trabalho que continua seu é
**saber o que pedir e perceber o que ela deixou passar**.

---

## Riscos, por probabilidade

### 1. O setup estourar os 20 minutos

É o risco mais provável. Para 30 pessoas, criar conta, fazer login no agente,
clonar e instalar dependências não cabe em 20 minutos.

**O que fazer:** deixe tudo pré-instalado nas máquinas (`preparar-maquina.ps1`
faz), e peça **antes da aula** que cada um chegue com conta Google e conta GitHub
criadas. Esses dois cadastros, feitos na hora, são metade do bloco.

E lembre do item que não dá para automatizar: **rode cada CLI uma vez em cada
máquina** antes da aula, para passar do "confia nesta pasta?" e do login.

### 2. A cota de IA acabar no meio

Ainda não sabemos o limite do plano gratuito. **Os grupos ajudam muito aqui**:
quatro agentes trabalhando em vez de trinta.

**O que fazer:** cada grupo usa **uma conta**, numa máquina só, com os outros
acompanhando na tela. E rode `/usage` numa máquina antes para ter o número.

### 3. O intervalo não render nada

Para a IA trabalhar sozinha, ela não pode parar pedindo permissão a cada arquivo.
No Claude Code é `--permission-mode`; no Antigravity é
`--dangerously-skip-permissions`, acrescentado em `args` no `agents.json`.

**Use só apontando para a pasta do exercício**, nunca num repositório de verdade.
É dar ao agente escrita sem pergunta — aceitável num fork descartável, não fora
dele.

### 4. Pull request virar o gargalo

30 pessoas abrindo PR exige conta no GitHub, acesso ao repositório e entendimento
de fork/branch. Dá uma aula inteira sozinho.

**Sugestão:** uma branch por grupo no mesmo repositório, com os grupos como
colaboradores. Quatro branches, quatro PRs — não trinta. Se o tempo apertar, a
revisão pode ser feita direto no `git diff`, sem PR; não perde nada do que
importa na aula.

---

## O que já está pronto

| Peça | Onde |
|---|---|
| App empacotado (.exe + skills + hooks) | `npm run dist:win` |
| Preparar as máquinas | `minicurso/preparar-maquina.ps1` |
| Projeto de exemplo (para a demonstração) | `minicurso/projeto-exemplo/` |
| Fork do virta com os bugs | `minicurso/fork-virta/` + `montar-fork-virta.mjs` |
| Modelo para **escrever** tarefa | `minicurso/COMO-ESCREVER-UMA-TAREFA.md` |
| Modelo para **executar** tarefa | `minicurso/COMO-FAZER-UMA-TAREFA.md` |
| Tarefas prontas (exemplos e reserva) | `minicurso/skills-virta/` |

As tarefas prontas **não são mais o exercício principal** — quem escreve as
tarefas é a turma. Elas servem como exemplo na demonstração, e como reserva se um
grupo travar na hora de escrever.
