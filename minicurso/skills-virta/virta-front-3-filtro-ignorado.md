---
name: "Virta Front 3 — Filtro de data ignorado em silêncio"
description: "Escolher só a data inicial faz o filtro ser descartado sem avisar ninguém."
---

# Virta Front 3 — Filtro de data ignorado em silêncio

Arquivo: `src/services/transactionService.ts`, função `getSummary`.

```ts
if (filters.startDate && filters.endDate) {
  params.set("startDate", filters.startDate);
  params.set("endDate", filters.endDate);
}
```

Com apenas uma das duas datas preenchidas, **as duas são descartadas**. A API
devolve o resumo do período inteiro, a tela mostra esses números, e nada indica
que o filtro não foi aplicado. O usuário toma decisão com o dado errado achando
que filtrou.

O comentário do código já admite o comportamento ("Only applied when both are
present"), o que torna isto uma decisão de produto, não um descuido — e é
justamente o tipo de decisão que vale discutir.

## O que fazer

Escolha **uma** saída e implemente:

- enviar o que foi preenchido, deixando a API decidir o período aberto; ou
- impedir no formulário que se envie só metade do intervalo; ou
- manter o descarte, mas avisar na tela que o filtro não foi aplicado.

## Pronto quando

- não existe mais caminho em que o usuário veja números não filtrados achando
  que filtrou;
- `npm run build` continua passando.

## O que entregar junto

Uma frase dizendo qual das três você escolheu e por quê. Essa é a parte que a IA
não decide por você.
