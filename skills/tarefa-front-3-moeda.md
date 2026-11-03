---
name: "Front 3 — Dinheiro formatado"
description: "A tabela mostra 1200 e 296.8333333333333. Formatar como moeda brasileira."
---

# Front 3 — Dinheiro formatado

A tabela mostra valores crus: `1200` em vez de `R$ 1.200,00`, e a parcela de
890,5 em 3 vezes aparece como `296.8333333333333`.

## O que fazer

Em `front/src/components/ListaCobrancas.tsx`, formate as duas colunas de dinheiro
(Total e Valor da parcela) como moeda brasileira.

Use `Intl.NumberFormat` com `pt-BR` e `BRL` — é o que o navegador já traz, sem
instalar biblioteca nenhuma.

## Pronto quando

- `1200` aparece como `R$ 1.200,00`;
- a parcela aparece com dois decimais, nunca com a dízima inteira;
- `npm run build` dentro de `front` continua passando.

## Extra, se sobrar tempo

Crie a função de formatação num arquivo só, em vez de repetir a chamada nas duas
colunas.
