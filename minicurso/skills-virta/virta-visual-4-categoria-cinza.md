---
name: "Virta V4 — Toda categoria aparece cinza"
description: "As etiquetas de categoria perderam a cor: todas iguais, impossível distinguir."
---

# Virta V4 — Toda categoria aparece cinza

As etiquetas de categoria (Mercado, Transporte, Salário) aparecem **todas na mesma
cor cinza**, na lista de transações e no dashboard. Cada categoria tem a sua cor
cadastrada, e nenhuma está sendo usada.

## O que fazer

O componente é `src/components/CategoryBadge.tsx`. Encontre por que a cor que
chega por `prop` nunca é aplicada.

## Pronto quando

- cada categoria aparece na sua própria cor;
- categoria **sem** cor cadastrada continua caindo no cinza, sem quebrar;
- `npm run build` continua passando.

## Olhe com atenção

A linha culpada compila, não dá aviso nenhum e parece certa numa leitura rápida.
Depois de consertar, explique em uma frase por que ela sempre devolvia cinza.
