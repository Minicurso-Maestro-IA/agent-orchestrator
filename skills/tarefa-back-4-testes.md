---
name: "Back 4 — Escrever os testes que faltam"
description: "aplicarJuros não tem teste nenhum, e é a função com a matemática mais fácil de errar."
---

# Back 4 — Escrever os testes que faltam

`back/cobrancas.js` tem seis funções exportadas e `back/cobrancas.test.js` cobre
três. A que está sem nenhum teste é a `aplicarJuros` — justamente a de matemática
mais fácil de errar.

## O que fazer

Em `back/cobrancas.test.js`, escreva testes para `aplicarJuros(valor, taxaAoMes,
meses)`. Cubra pelo menos:

- um caso normal (por exemplo, 1000 a 1% ao mês por 12 meses);
- zero meses, que não deve mudar o valor;
- taxa zero, que também não deve mudar o valor.

Use `assert.ok(Math.abs(resultado - esperado) < 0.01)` para comparar números com
casa decimal — comparar com `strictEqual` falha por arredondamento de ponto
flutuante.

## Pronto quando

- `node --test` dentro de `back` passa com os testes novos;
- os testes falham se alguém trocar o `Math.pow` por uma multiplicação simples
  (teste isso de propósito, depois desfaça).

## A pergunta de fundo

Um teste que passa com o código errado não serve para nada. Como você sabe que o
seu teste realmente testa?
