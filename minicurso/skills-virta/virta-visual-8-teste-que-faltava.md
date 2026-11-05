---
name: "Virta V8 — O teste que teria pego o bug (backend)"
description: "A suíte passa verde com o filtro quebrado. Escreva o teste que faltava."
---

# Virta V8 — O teste que teria pego o bug

Faça as tarefas **V6** e **V7** antes desta.

`TransactionServiceTest` existe e passa. Passou o tempo todo, inclusive com o
filtro de tipo ignorado e o filtro de categoria invertido. Uma suíte que fica
verde enquanto a tela mente não está protegendo ninguém.

## O que fazer

Em `TransactionServiceTest.java`, escreva os testes que teriam reprovado:

1. `list` com `type = INCOME` devolve **só** receitas;
2. `list` com `type = null` devolve tudo;
3. o resumo filtrado por uma categoria considera **só** aquela categoria.

Siga a convenção que o arquivo já usa — Mockito com `@Mock` e `@InjectMocks`,
montando as entidades na mão. Não introduza biblioteca nova.

## Pronto quando

- `mvn test` passa com os testes novos **no código já corrigido**;
- e, o mais importante: desfazendo a correção de V6 ou V7, os testes novos
  **falham**. Teste isso de propósito, depois refaça a correção.

## Por que o segundo item é o que importa

Um teste que passa nos dois casos — com e sem o bug — não testa nada. É o erro
mais comum de quem escreve teste depois do conserto, e é o que separa cobertura
de proteção.
