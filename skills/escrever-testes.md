---
name: Escrever Testes
description: Cria testes para o código alterado, cobrindo casos de borda
---

# Escrever Testes

Escreva testes automatizados para o código que foi alterado recentemente.

## Regras

- Siga o framework e as convenções que o projeto já usa — descubra olhando os
  testes existentes antes de escrever o primeiro.
- Um teste por comportamento, com nome que descreve o comportamento, não a função.
- Cubra o caminho feliz **e** os casos de borda: entrada vazia, limites,
  erro do lado de fora (rede, disco), concorrência quando aplicável.
- Nada de mock do que não precisa ser mockado.

## Entrega

Rode a suíte ao final e reporte o resultado real, incluindo falhas.
