---
name: "Back 3 — POST sem validação"
description: "POST /cobrancas com corpo vazio cria uma cobrança fantasma. Validar a entrada."
---

# Back 3 — POST sem validação

Com o servidor no ar:

```bash
curl -i -X POST http://localhost:3001/cobrancas -H "Content-Type: application/json" -d "{}"
```

Cria uma cobrança com cliente, total e parcelas `undefined`, e responde `200`.

## O que fazer

Em `back/server.js` (ou em `back/cobrancas.js`, se achar que o lugar é lá — a
decisão é sua, e vale explicar):

1. valide que `cliente` é texto não vazio, e que `total` e `parcelas` são números
   maiores que zero;
2. responda `400` com uma mensagem útil quando a entrada for inválida;
3. responda `201` quando criar, em vez de `200`.

## Pronto quando

- `POST` com `{}` responde `400` e **não** cria nada;
- `POST` válido responde `201` com a cobrança criada;
- `GET /cobrancas` não mostra nenhuma cobrança fantasma;
- `node --test` continua passando.
