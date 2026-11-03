---
name: "Virta Front 1 — Evento de SSE que se perde"
description: "O stream de eventos da carteira pode perder um aviso que chega partido em dois pedaços."
---

# Virta Front 1 — Evento de SSE que se perde

Arquivo: `src/services/transactionService.ts`, função `subscribeToWalletEvents`.

O código lê o stream assim:

```ts
const {value, done} = await reader.read();
if(done) break;
if(decoder.decode(value).includes("transaction-changed")){
  onChange();
}
```

Cada leitura é testada **isoladamente**. Mas um chunk da rede não respeita a
fronteira da mensagem: se um pedaço terminar em `transaction-cha` e o próximo
começar em `nged`, nenhum dos dois contém o texto inteiro e o aviso **some**. A
tela fica desatualizada sem ninguém perceber.

## O que fazer

Acumule o que chega num buffer entre as leituras, em vez de examinar cada chunk
sozinho, e processe as mensagens completas. Use `decoder.decode(value, { stream: true })`,
que é a forma correta de decodificar um stream em pedaços.

## Pronto quando

- um evento continua sendo detectado mesmo quando o texto chega partido;
- `npm run build` continua passando.

## Como provar que funciona

Antes de corrigir, force o caso: simule duas leituras, uma terminando no meio da
palavra. O comportamento atual perde o evento; o corrigido não.

## Repare também

O buffer não pode crescer para sempre. O que você descarta, e quando?
