---
name: "Virta V5 — Gráficos com receita e despesa trocadas"
description: "No dashboard, receita aparece em vermelho e despesa em verde."
---

# Virta V5 — Gráficos com receita e despesa trocadas

No **Dashboard**, os gráficos mostram receita em **vermelho** e despesa em
**verde** — o contrário da convenção que o resto do app usa. Compare com a lista
de transações e com os cartões de resumo da mesma tela.

## O que fazer

As cores vivem no topo de `src/pages/DashboardPage.tsx`. Corrija.

## Pronto quando

- receita em verde, despesa em vermelho, nos gráficos e na legenda;
- bate com o que a tela de transações mostra;
- `npm run build` continua passando.

## O passo que separa a correção boa da ruim

Essa inversão só foi possível porque a cor é escolhida em dois lugares diferentes
do projeto. Encontre o outro e proponha (sem necessariamente implementar) como
fazer existir uma fonte única — para que o bug não possa voltar.
