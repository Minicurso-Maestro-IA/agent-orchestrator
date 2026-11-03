# Como escrever uma tarefa para a IA

Seu grupo escolhe um problema e escreve a tarefa. **Outro grupo vai executá-la** —
e não vai poder te perguntar nada.

É aí que está o aprendizado: se o texto estiver vago, quem sofre não é você. Você
vai descobrir isso olhando o que o outro grupo entregou.

---

## O modelo

Copie as quatro seções. Todas são obrigatórias.

```markdown
---
name: "Nome curto que aparece no seletor"
description: "Uma linha dizendo o sintoma."
---

# Título

## O sintoma
O que se vê de errado. Onde clicar para ver acontecer.

## Onde olhar
Um ponto de partida — arquivo, tela ou rota. Não a solução.

## Pronto quando
A lista de checagem. Cada item verificável por outra pessoa, sem discussão.

## A pergunta
Algo que a IA não decide sozinha, e que quem executar precisa responder.
```

Salve como `.md` na pasta de skills e ele aparece no seletor do orquestrador.

---

## As quatro seções, uma a uma

### O sintoma — descreva, não diagnostique

Diga o que **se vê**, não o que você acha que é a causa. Se você já diagnosticou
errado, leva o outro grupo junto para o buraco.

❌ "A função de formatação está quebrada"
✅ "Na lista de transações, a data aparece como `2026-01-15` em vez de `15/01/2026`"

Inclua **como reproduzir**: em qual tela, o que clicar, o que esperar ver.

### Onde olhar — ponto de partida, não resposta

Dê um começo de investigação, não a linha do conserto. Se você já sabe a linha,
a tarefa vira digitação e o outro grupo não aprende a procurar.

❌ "Troque `flex-1` por `min-w-0 flex-1` na linha 215"
✅ "Começa pelo componente que desenha a lista de transações"

Quando não souber de qual lado está (front ou back), **diga isso** — e sugira
como descobrir. "Abra a aba Rede e veja se o filtro sai na URL" é uma ótima
instrução de tarefa.

### Pronto quando — verificável por outra pessoa

Esta seção decide se a tarefa está feita. Se depende de opinião, está mal escrita.

❌ "A tela tem que ficar boa"
✅ "Despesa aparece em vermelho com `-`; receita em verde com `+`; `npm run build` passa"

Inclua sempre o comando que prova: `npm run build`, `mvn test`, ou "abra a tela
X e veja Y".

### A pergunta — o que a IA não decide

É o que separa "o agente consertou" de "a gente aprendeu". Uma decisão, um
porquê, um caso de borda.

Exemplos bons:
- "Valor negativo deveria ser aceito? O sistema já separa receita de despesa."
- "Por que aquela linha sempre devolvia cinza, mesmo compilando sem aviso?"
- "Lançar erro ou devolver zero? Justifique."

---

## Antes de entregar, teste o seu texto

Leia como se você fosse o outro grupo, sem nenhum contexto do que vocês
conversaram. Então:

1. **Dá para reproduzir o problema só com o que está escrito?**
2. **Dá para saber quando parar?**
3. **Tem alguma palavra que só o seu grupo entende?** ("aquele botão", "a tela
   de antes", "o cálculo errado")
4. **Você resolveu a tarefa por acidente?** Se o texto já diz o que mudar, apague
   e deixe só o sintoma.

---

## Escrevendo uma melhoria em vez de um bug

Vale também propor algo que **falta** — "queria criar a categoria na hora do
lançamento". Muda só o sintoma:

```markdown
## O que falta hoje
Ao lançar uma transação, só dá para escolher categoria já existente. Quem precisa
de uma nova tem que sair da tela, criar, e voltar — perdendo o que já digitou.

## Pronto quando
- dá para criar categoria sem sair do formulário de lançamento;
- o que já tinha sido digitado não se perde;
- a categoria nova já aparece selecionada;
- `npm run build` passa.
```

Melhoria costuma render **discussão melhor** que bug, porque exige decidir o
comportamento — e é aí que o pensamento crítico aparece.

---

## O erro mais comum

Escrever para alguém que já sabe do que você está falando.

A IA não participou da conversa do seu grupo. Não viu a tela que vocês viram. Não
sabe o que é "aquele problema do gráfico". Tudo que ela tem é o seu texto — e o
outro grupo também.
