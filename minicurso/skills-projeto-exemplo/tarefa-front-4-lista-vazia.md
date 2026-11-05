---
name: "Front 4 — Lista vazia e key do React"
description: "Sem cobranças o usuário vê só o cabeçalho; e a lista usa o índice como key."
---

# Front 4 — Lista vazia e key do React

Dois problemas na mesma tela.

**1.** Quando não há nenhuma cobrança, o usuário vê apenas o cabeçalho da tabela,
sem nenhuma explicação.

**2.** A lista usa o índice do array como `key`. Funciona hoje e quebra no dia em
que alguém remover ou reordenar um item — o React passa a reaproveitar a linha
errada.

## O que fazer

Em `front/src/components/ListaCobrancas.tsx`:

1. mostre uma mensagem quando a lista estiver vazia, em vez da tabela sozinha;
2. troque a `key` por algo estável de verdade.

## Pronto quando

- com a lista vazia, a tela explica que não há cobranças;
- a `key` não depende mais da posição no array;
- `npm run build` dentro de `front` continua passando.

## Para discutir depois

Por que o índice como `key` não dá erro nenhum hoje? O que exatamente precisa
acontecer para o bug aparecer?
