---
name: "Virta V2 — Data e valor crus na tela"
description: "A lista mostra 2026-01-15 e 1234.5 em vez de 15/01/2026 e R$ 1.234,50."
---

# Virta V2 — Data e valor crus na tela

Na tela de **Transações**, as datas aparecem como `2026-01-15` e os valores como
`1234.5`. Deveriam aparecer como `15/01/2026` e `R$ 1.234,50`.

## Antes de escrever qualquer coisa

Procure em `src/lib/format.ts`. **As funções já existem e funcionam.** O problema
não é escrever formatação nova: é que a tela deixou de usá-la.

Esta é a parte que importa na tarefa — a tentação é criar uma formatação própria
ali mesmo no componente, e aí o projeto passa a ter duas, que divergem com o
tempo.

## O que fazer

Em `src/components/wallet/WalletTransactions.tsx`, volte a usar os formatadores
de `@/lib/format` para a data e para o valor.

## Pronto quando

- datas em `dd/mm/aaaa` e valores em `R$ 0.000,00`;
- nenhuma função de formatação nova foi criada;
- `npm run build` continua passando.

## Para comparar depois

Veja como a `DashboardPage` faz. Ela está certa — serve de referência.
