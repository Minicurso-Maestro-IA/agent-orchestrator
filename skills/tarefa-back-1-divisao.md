---
name: "Back 1 — Divisão por zero"
description: "calcularParcela(1200, 0) devolve Infinity. Tratar e provar com teste."
---

# Back 1 — Divisão por zero

Na pasta `back`:

```bash
node -e "const r=require('./cobrancas');console.log(r.calcularParcela(1200,0))"
```

Imprime `Infinity`. Esse valor segue adiante e aparece na tela do usuário.

## O que fazer

1. Em `back/cobrancas.js`, decida o que `calcularParcela` faz quando `parcelas`
   é zero, negativo ou não é número. Implemente.
2. Em `back/cobrancas.test.js`, acrescente um teste que prove o novo
   comportamento.

## Pronto quando

- `node --test` dentro de `back` passa, incluindo o teste novo;
- os três testes que já existiam continuam passando.

## O que decidir, e justificar

Lançar um erro ou devolver zero? Não existe resposta única — escolha uma e
explique por quê. É a parte da tarefa que a IA não decide sozinha por você.
