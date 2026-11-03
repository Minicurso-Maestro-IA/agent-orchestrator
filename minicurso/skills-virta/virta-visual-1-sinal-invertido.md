---
name: "Virta V1 — A lista mente sobre entrada e saída"
description: "Na tela de transações, despesa aparece com '+' e em verde, igualzinho a uma receita."
---

# Virta V1 — A lista mente sobre entrada e saída

Abra a tela de **Transações**. Toda linha aparece em **verde**, e uma despesa
mostra **`+`** na frente do valor — como se fosse dinheiro entrando.

Repare na contradição: a bolinha da esquerda tem a seta certa (para baixo numa
despesa), mas o valor ao lado diz o contrário. Um dos dois está mentindo.

## O que fazer

Encontre onde o valor da transação é desenhado em
`src/components/wallet/WalletTransactions.tsx` e faça receita e despesa voltarem
a se distinguir: sinal e cor coerentes com o tipo.

## Pronto quando

- despesa aparece em vermelho com `-`, receita em verde com `+`;
- a seta da bolinha concorda com o sinal e com a cor;
- `npm run build` continua passando.

## Por que isso é grave

Não é estética. Numa tela de dinheiro, confundir entrada com saída faz a pessoa
tomar decisão errada olhando para o número certo.
