# Tarefas da aula

Oito tarefas sobre o projeto em `minicurso/projeto-exemplo/`, quatro de frontend
e quatro de backend. Cada uma é uma **skill** do orquestrador: o aluno escolhe no
seletor **Skill** ao criar o terminal, e o agente recebe o texto como primeiro
prompt.

Todas têm a mesma estrutura: o que está errado, o que fazer, **pronto quando**, e
uma pergunta que a IA não responde sozinha.

---

## As tarefas

| # | Skill no seletor | Onde | Ensina | Esforço |
|---|---|---|---|---|
| F1 | Front 1 — Estado de carregamento | `front/src/App.tsx` | estado assíncrono; a diferença entre "vazio" e "ainda não chegou" | baixo |
| F2 | Front 2 — Erro da API engolido | `front/src/api.ts`, `App.tsx` | falha silenciosa; por que `console.log` não é tratamento de erro | médio |
| F3 | Front 3 — Dinheiro formatado | `front/src/components/ListaCobrancas.tsx` | `Intl.NumberFormat`; ponto flutuante na tela | baixo |
| F4 | Front 4 — Lista vazia e key do React | `front/src/components/ListaCobrancas.tsx` | estado vazio; por que `key={index}` é uma bomba-relógio | médio |
| B1 | Back 1 — Divisão por zero | `back/cobrancas.js` | entrada inválida; **decidir** o comportamento e justificar | baixo |
| B2 | Back 2 — 404 que responde 200 | `back/server.js` | códigos HTTP; o front não adivinha o que deu errado | baixo |
| B3 | Back 3 — POST sem validação | `back/server.js` | validação de entrada; 400 e 201 | médio |
| B4 | Back 4 — Escrever os testes que faltam | `back/cobrancas.test.js` | como saber se um teste testa alguma coisa | alto |

---

## Ordem sugerida numa aula

**Primeiro contato (uma tarefa, todo mundo junto):** **B1**. É pequena, roda sem
`npm install`, e o resultado se prova com `node --test` em dois segundos. Serve
para a turma ver o ciclo inteiro — escolher a skill, o agente trabalhar, a faixa
de ações mostrando o que ele faz, o veredito no fim.

**Em duplas:** uma de front e uma de back. F1 + B2 é o par mais equilibrado.

**Para fechar, com dois agentes:** **B3 ou B4** montadas como pipeline
codifica → revisa:

1. nó A com a skill da tarefa;
2. nó B com a skill **Code Review**;
3. aresta A → B em `sempre`, e B → A em `reprovado`.

O aluno dá a tarefa a A e **não toca em mais nada**. Ver o trabalho ir sozinho
para o revisor, voltar reprovado e ser corrigido é o momento em que a ficha cai.

---

## O que observar enquanto roda

Peça à turma para olhar o nó, não o texto:

- a **bolinha** do cabeçalho: âmbar enquanto trabalha, verde quando para;
- a **faixa de ações**: `leu cobrancas.js`, `rodou node --test`. Clicando, abre a
  sequência inteira;
- o **veredito** no fim do turno, e a palavra *automático* quando o agente
  encerra sem decidir;
- a **aresta** acendendo quando o trabalho passa para o próximo nó.

A faixa de ações só funciona com **Claude Code** — é a única CLI do catálogo com
hooks. Com Antigravity, tudo o mais vale, menos a faixa.

---

## Depois de cada tarefa

Vale mais que a tarefa em si:

1. **Leia o diff.** O agente fez só o que foi pedido, ou aproveitou e mexeu em
   mais coisa?
2. **Rode o que ele disse que rodou.** A faixa mostra `rodou node --test` — passou
   mesmo?
3. **Responda a pergunta final da tarefa.** Todas terminam com uma decisão que a
   IA não toma pelo aluno: lançar erro ou devolver zero, onde validar, como saber
   que um teste testa.

---

## Adaptando para o projeto real

Quando o projeto da empresa entrar no lugar do exemplo, as oito tarefas migram
com pouca edição: elas falam de **padrões** (estado de carregamento, erro
engolido, validação de entrada, teste ausente), não deste código. O que muda em
cada skill é o caminho dos arquivos e o comando de teste.
