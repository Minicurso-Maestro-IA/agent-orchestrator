---
name: "Virta Front 2 — SSE que morre em silêncio"
description: "Quando o stream cai, a assinatura morre para sempre e nada avisa. Falta reconectar."
---

# Virta Front 2 — SSE que morre em silêncio

Arquivo: `src/services/transactionService.ts`, função `subscribeToWalletEvents`.

Dois caminhos levam ao mesmo lugar:

```ts
if(!res.ok || !res.body) return;      // desiste caladinho
...
while(true){
  const {value, done} = await reader.read();
  if(done) break;                      // stream acabou: a assinatura morre aqui
  ...
}
} catch{
//abort
}
```

Se o servidor reiniciar, ou um proxy cortar a conexão ociosa, `done` vira `true`,
o laço termina e **a carteira nunca mais recebe atualização** — até a pessoa
recarregar a página. O `catch` vazio engole qualquer falha, não só o abort que o
comentário sugere.

## O que fazer

1. Reconecte quando o stream terminar sem ter sido abortado de propósito, com uma
   espera crescente entre as tentativas (comece em ~1s, dobre, com um teto).
2. Distinga o abort intencional (`controller.abort()`) de um erro de verdade: só
   o primeiro deve encerrar em silêncio.
3. Pare de reconectar quando a função de limpeza for chamada.

## Pronto quando

- derrubar o backend e subir de novo volta a atualizar a tela sozinho;
- sair da página não deixa nenhuma tentativa de reconexão rodando;
- `npm run build` continua passando.

## A pergunta de fundo

Reconectar para sempre é sempre certo? O que acontece se o token expirou e o
servidor vai responder 401 em toda tentativa?
