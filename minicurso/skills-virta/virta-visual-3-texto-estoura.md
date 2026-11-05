---
name: "Virta V3 — Descrição longa quebra a linha"
description: "Uma transação com descrição comprida empurra o valor para fora da tela."
---

# Virta V3 — Descrição longa quebra a linha

Crie uma transação com uma descrição bem longa (umas 20 palavras) e olhe a lista:
o texto ocupa a linha inteira e **empurra o valor e os botões para fora**, ou
espreme tudo. A lista perde o alinhamento das outras linhas.

## O que fazer

Em `src/components/wallet/WalletTransactions.tsx`, faça a descrição ser cortada
com reticências em vez de empurrar os vizinhos.

## A dica que vale a tarefa inteira

Só pedir para cortar o texto **não resolve sozinho** num layout flex. Um item
flex, por padrão, não encolhe além do tamanho do seu conteúdo. Existe uma
propriedade que precisa acompanhar o corte para que ele funcione de verdade —
descubra qual, e explique por que ela é necessária.

## Pronto quando

- a descrição longa vira reticências;
- valor e botões ficam alinhados, iguais aos das outras linhas;
- a tela aguenta ser estreitada sem quebrar;
- `npm run build` continua passando.
