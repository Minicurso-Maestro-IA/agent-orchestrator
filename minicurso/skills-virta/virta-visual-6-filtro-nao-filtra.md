---
name: "Virta V6 — O filtro de tipo não filtra (backend)"
description: "Na tela de transações, escolher Receitas ou Despesas continua mostrando tudo."
---

# Virta V6 — O filtro de tipo não filtra

Na tela de **Transações**, filtre por Receitas. A lista continua mostrando
despesas também. Filtre por Despesas: mesma coisa.

## O primeiro passo é decidir onde procurar

O sintoma está na tela, mas a causa pode estar nos dois lados. Antes de abrir
qualquer arquivo, descubra **qual camada está errada**: abra as ferramentas de
desenvolvedor do navegador, aba Rede, e veja a chamada que sai quando você
filtra.

- Se a URL **não** leva o filtro → o problema é no frontend.
- Se leva o filtro e a resposta vem com tudo → o problema é no backend.

Essa separação é a tarefa de verdade. Consertar é a parte fácil.

## Onde olhar depois de decidir

- Frontend: `src/services/transactionService.ts`, função `listTransactions`.
- Backend: `TransactionService.java`, método `list`.

## Pronto quando

- filtrar por Receitas mostra só receitas, e por Despesas só despesas;
- sem filtro continua mostrando tudo;
- o backend compila e `mvn test` continua passando.

## A pergunta que fecha a tarefa

A suíte de testes passa com esse bug no código. O que isso diz sobre a suíte?
