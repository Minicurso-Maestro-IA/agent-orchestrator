---
name: "Back 2 — 404 que responde 200"
description: "GET /cobrancas/999 responde 200 com corpo vazio. Deveria ser 404."
---

# Back 2 — 404 que responde 200

Com o servidor no ar (`node server.js` na pasta `back`):

```bash
curl -i http://localhost:3001/cobrancas/999
```

Responde `200` com o corpo vazio. O front não tem como distinguir "essa cobrança
não existe" de "deu errado alguma coisa".

## O que fazer

Em `back/server.js`, faça a rota `GET /cobrancas/:id` responder `404` com uma
mensagem de erro quando o id não existir.

## Pronto quando

- `curl -i http://localhost:3001/cobrancas/999` responde `404`;
- `curl -i http://localhost:3001/cobrancas/1` continua respondendo `200` com a
  cobrança;
- `node --test` continua passando.

## Repare

A rota usa `startsWith('/cobrancas/')`. Vale conferir o que acontece com
`/cobrancas/abc`.
