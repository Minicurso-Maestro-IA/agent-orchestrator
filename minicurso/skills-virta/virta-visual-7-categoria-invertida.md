---
name: "Virta V7 — Filtrar por categoria mostra todas as outras (backend)"
description: "No dashboard, escolher 'Mercado' devolve justamente tudo que NÃO é Mercado."
---

# Virta V7 — Filtrar por categoria mostra todas as outras

No **Dashboard**, filtre por uma categoria. O resumo e os gráficos passam a
mostrar exatamente as transações de **todas as outras** categorias — o oposto do
pedido.

Repare que não é um filtro que deixou de funcionar: ele funciona, ao contrário.
Isso é pista: um filtro quebrado costuma devolver tudo ou nada; um filtro
invertido devolve o complemento.

## Onde olhar

`TransactionService.java`, no método auxiliar que decide se uma transação entra
no resumo. Procure o que compara a categoria da transação com as escolhidas.

## Pronto quando

- filtrar por uma categoria mostra **só** aquela categoria;
- filtrar por duas mostra as duas;
- sem filtro, continua mostrando tudo;
- transação sem categoria continua se comportando como antes quando nenhuma
  categoria está escolhida;
- o backend compila e `mvn test` continua passando.

## Cuidado com o caso de borda

Existe uma regra sobre transações **sem** categoria, e ela está documentada num
comentário logo acima do método. Conserte o filtro sem quebrar essa regra.
