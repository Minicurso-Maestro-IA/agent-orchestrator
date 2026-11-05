# Pipeline de 3 agentes: validar → codar → revisar

Como montar, no orquestrador, o fluxo em que um agente valida a tarefa, outro
escreve o código e um terceiro revisa — e a revisão, quando reprova, devolve o
trabalho para o começo.

```
   [1 Validar] --aprovado--> [2 Codar] --aprovado--> [3 Revisar]
        ^                                                 |
        |                    reprovado                    |
        +-------------------------------------------------+
```

## Por que três, e não um

Um agente só escreve o código e diz que terminou. Quem confere é o aluno, que
acabou de ver a IA trabalhar e está inclinado a acreditar. Separar os papéis
força três coisas a ficarem escritas:

- **Validar** obriga alguém a reproduzir o problema antes de consertar. Metade
  das tarefas mal escritas morre aqui, que é onde deve morrer.
- **Codar** fica com um escopo que outra pessoa delimitou, em vez de inventar o
  próprio.
- **Revisar** julga o diff sem ter participado de escrevê-lo — e é só isso que
  separa "o build passou" de "a tela está certa".

Cada agente **não vê a conversa dos outros**. O único canal entre eles é o campo
`reason` do arquivo de status. Isso é de propósito: obriga cada um a escrever o
que apurou, e é exatamente a dificuldade que a aula quer mostrar.

## Antes de abrir o app

1. Aponte as skills para esta pasta e abra o orquestrador **numa janela nova**:

   ```
   setx AGENT_ORCHESTRATOR_SKILLS_DIR C:\minicurso\orquestrador\skills-virta
   ```

2. Rode `agy` uma vez na mão, dentro da pasta do projeto, e faça o login com a
   conta do Google. Enquanto o assistente de primeiro uso estiver na tela, o
   agente não lê o prompt inicial e o pipeline parece quebrado sem estar.

## Montando no canvas

Crie três terminais, cada um com a skill do seu papel:

| Nó | Skill | Agente |
|---|---|---|
| 1 | Papel 1 — Especificar | Antigravity CLI |
| 2 | Papel 2 — Codar | Antigravity CLI |
| 3 | Papel 3 — Revisar | Antigravity CLI |

Ligue 1 → 2, 2 → 3 e 3 → 1. **Clique em cada aresta** para escolher em qual
veredito ela dispara: ela cicla entre *sempre*, *aprovado* e *reprovado*.

- 1 → 2: **aprovado**
- 2 → 3: **aprovado**
- 3 → 1: **reprovado**

A aresta 3 → 1 fechando o ciclo é o que faz a reprovação voltar para o começo.
Se a revisão aprovar, não há aresta de *aprovado* saindo do 3: o pipeline
termina, e o app avisa "fim do pipeline".

> **Variante:** ligar 3 → **2** no lugar de 3 → 1 manda o reprovado direto para
> quem codou, sem repassar pela validação. É mais rápido e gasta menos cota;
> em compensação ninguém reconfere se o pedido fazia sentido. Dá para ter as
> duas arestas, mas aí as duas disparam juntas e dois agentes trabalham no
> mesmo arquivo ao mesmo tempo — não faça isso.

## Rodando

Cole o corpo da issue no **nó 1** e deixe correr. O resto é automático: cada
agente termina gravando o status, e o app entrega o resumo ao próximo.

O app para sozinho em **20 saltos**. Se o pipeline ficar girando entre revisar e
validar, é sinal de que a tarefa não está clara o bastante — e isso é um
resultado da aula, não um defeito do app.

## Cota, com conta gratuita

Três agentes por tarefa gastam **três vezes** a cota de um. Uma reprovação
acrescenta mais dois passos. Numa conta gratuita do Google isso acaba rápido.

Para a aula, duas saídas:

- deixe o pipeline de três só na **demonstração**, e dê aos alunos um agente só;
- ou use o pipeline de três numa tarefa só, a primeira, para eles verem o
  mecanismo, e o resto da aula com um agente.

Confira o que sobrou com `/usage` dentro do `agy`.

## O que vai dar errado (e é esperado)

- **O agente termina sem gravar o status.** O app espera e nada anda. Com o
  Claude Code existe um hook que grava sozinho; com o `agy` depende da
  obediência do modelo. Se travar, grave o JSON na mão — o caminho está no
  prompt que o agente recebeu.
- **O revisor conserta em vez de reprovar.** É a falha mais comum, e a skill do
  papel 3 bate nessa tecla duas vezes. Se acontecer, mostre para a turma: o
  pipeline inteiro virou enfeite.
- **O validador entrega o conserto pronto.** Aí o nó 2 só digita. Também está
  escrito na skill, e também vai acontecer.
