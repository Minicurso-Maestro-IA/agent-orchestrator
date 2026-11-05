---
name: "Virta V4 — Toda categoria aparece cinza"
description: "As etiquetas de categoria perderam a cor: todas iguais, impossível distinguir."
---

# Virta V4 — Toda categoria aparece cinza

As etiquetas de categoria (Mercado, Transporte, Salário) aparecem **todas cinzas**
— o fundo e o texto. Mas repare na bolinha pequena dentro de cada etiqueta: ela
mantém a cor certa de cada categoria.

Ou seja, a cor **chega** ao componente. Ela só não é usada onde deveria.

## O que fazer

O componente é `src/components/CategoryBadge.tsx`. Encontre por que a cor que
chega por `prop` nunca é aplicada.

## Pronto quando

- cada categoria aparece na sua própria cor;
- categoria **sem** cor cadastrada continua caindo no cinza, sem quebrar;
- `npm run build` continua passando.

## Olhe com atenção

Há duas variáveis de cor no componente, e uma delas é usada no lugar da outra.
Compila, não gera aviso e passa numa leitura rápida. Depois de consertar, explique
em uma frase qual era a confusão.
