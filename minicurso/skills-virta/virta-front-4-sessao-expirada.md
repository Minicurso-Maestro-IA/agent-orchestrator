---
name: "Virta Front 4 — Sessão expirada vira erro genérico"
description: "Token vencido cai como ApiError 401 em cada chamada, e cada tela trata do seu jeito."
---

# Virta Front 4 — Sessão expirada vira erro genérico

Arquivo: `src/lib/http.ts`, função `apiFetch`.

O wrapper anexa o Bearer token e normaliza erros num `ApiError` com `status`.
Quando o token expira, o backend responde 401 e isso vira um `ApiError` como
qualquer outro — que cada página trata como quiser, ou não trata.

Procure por `ApiError` e por `401` no projeto e veja quantos lugares diferentes
lidam (ou não) com sessão vencida.

## O que fazer

Centralize o 401 em `apiFetch`: ao receber um, limpe a sessão armazenada e leve o
usuário para a tela de login, em vez de deixar cada página reinventar isso.

Olhe antes como `src/lib/session.ts` e `src/context/AuthContext.tsx` guardam e
limpam a sessão, e use o que já existe em vez de criar um caminho paralelo.

## Pronto quando

- com um token inválido, qualquer tela leva ao login em vez de mostrar erro cru;
- o fluxo normal de login e de logout continua funcionando;
- `npm run build` continua passando.

## Cuidado

A própria chamada de login pode responder 401 quando a senha está errada. Essa
**não** deve redirecionar para lugar nenhum — tem que continuar mostrando "senha
inválida". Trate a diferença.
