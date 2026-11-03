---
name: "Front 2 — Erro da API engolido"
description: "Com o backend desligado, a tela fica vazia e não diz por quê. Tratar a falha."
---

# Front 2 — Erro da API engolido

Desligue o backend e abra a tela: ela fica permanentemente vazia, sem nenhuma
mensagem. A promessa do `fetch` rejeita, ninguém escuta, e o usuário fica sem
saber se não há cobranças ou se o sistema quebrou.

## O que fazer

1. Em `front/src/api.ts`, faça `buscarCobrancas` reagir quando a resposta não for
   bem-sucedida (`resposta.ok`).
2. Em `front/src/App.tsx`, guarde o erro em estado e mostre uma mensagem clara
   para o usuário, com a opção de tentar de novo.

## Pronto quando

- com o backend desligado, a tela diz que não conseguiu carregar;
- com o backend ligado, nada muda no comportamento normal;
- `npm run build` dentro de `front` continua passando.

## Cuidado

Não troque a mensagem de erro por um `console.log`. O usuário não abre o console.
