---
name: "Front 1 — Estado de carregamento"
description: "A tela diz '0 no total' enquanto a API ainda está respondendo. Mostrar que está carregando."
---

# Front 1 — Estado de carregamento

No projeto de exemplo (pasta `front`), a página começa com uma lista vazia e só
preenche quando a API responde. Entre uma coisa e outra, o usuário vê
"0 no total" e uma tabela vazia — como se não existisse cobrança nenhuma.

## O que fazer

Em `front/src/App.tsx`, acrescente um estado de carregamento e mostre
"Carregando..." enquanto a busca não termina.

## Pronto quando

- a tela nunca mostra "0 no total" antes de a API responder;
- depois que carrega, a tabela aparece normalmente;
- `npm run build` dentro de `front` continua passando (ele roda o TypeScript).

## Dica de investigação

Comece lendo `front/src/App.tsx` e veja o que acontece entre o `useEffect` e a
chegada dos dados.
