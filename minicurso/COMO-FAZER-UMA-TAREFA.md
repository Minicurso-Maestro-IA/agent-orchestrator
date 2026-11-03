# Como fazer uma tarefa do backlog

O caminho de um card, do Backlog até o Done, usando o orquestrador. É o mesmo
para todas as tarefas — decore este fluxo e o resto é detalhe de cada card.

---

## 1. Pegue o card

No board, puxe um card do **Backlog** para **Em andamento** e **se atribua**.
Um card por pessoa de cada vez: metade das tarefas em andamento é pior que
nenhuma.

Leia o card inteiro **antes** de abrir qualquer coisa. Preste atenção em duas
seções: **Pronto quando**, que é o seu critério de parada, e **A pergunta**, que
é o que você vai responder no final — e que a IA não responde por você.

## 2. Abra o terminal certo no orquestrador

Na barra de cima, escolha três coisas e crie o terminal:

| Campo | O que escolher |
|---|---|
| **Shell** | PowerShell |
| **IA** | Claude Code |
| **Skill** | a skill com o nome do card |

O agente sobe já com a tarefa como primeiro prompt. Você não precisa digitar o
pedido: ele está na skill.

> Se o seletor de Skill estiver vazio, a pasta de skills não foi encontrada.
> Avise o instrutor em vez de digitar a tarefa na mão — é configuração, não é
> você.

## 3. Olhe o nó enquanto ele trabalha

Não fique lendo o texto rolando. Olhe o **nó**:

- a **bolinha** do cabeçalho fica âmbar enquanto ele trabalha e verde quando
  para;
- a **faixa de ações** mostra o que ele está fazendo agora — `leu
  WalletTransactions.tsx`, `rodou npm run build`. Clique nela para ver a
  sequência inteira.

Esse é o exercício de observação: antes de olhar o resultado, acompanhe o
**caminho**. Ele leu os arquivos certos? Rodou o que disse que rodou?

## 4. Leia o veredito

Quando o turno acaba, aparece no terminal `▸ APROVADO` ou `▸ REPROVADO`.

Se vier **`(automático: o agente encerrou sem gravar o status)`**, significa que
ele terminou sem decidir nada — o veredito foi do sistema, não dele. Não conte
isso como aprovação.

## 5. Leia o diff. Esta é a parte que não se delega

```powershell
git diff
```

Três perguntas, sempre:

1. **Ele mexeu só no que a tarefa pedia?** Mudança a mais é dívida a mais.
2. **Você entende cada linha?** Se não entende, pergunte a ele ali mesmo: "por
   que você mudou isso?". Entender faz parte da tarefa.
3. **Ele apagou alguma coisa?** Olhe as linhas com `-`, não só as com `+`.

Se algo não estiver certo, não conserte na mão em silêncio: diga a ele o que
está errado e deixe corrigir. Depois leia de novo.

## 6. Verifique de verdade

Rode o que o card manda em **Pronto quando**:

```powershell
npm run build       # frontend
mvn test            # backend
```

E **olhe a tela**, nas tarefas visuais. Build passando não quer dizer tela
certa — foi exatamente assim que estes bugs chegaram aqui.

## 7. Responda a pergunta do card

Toda tarefa termina com uma decisão ou uma explicação que a IA não dá por você:
lançar erro ou devolver zero, por que aquela linha sempre devolvia cinza, por que
cortar o texto não basta num layout flex.

**Escreva a resposta como comentário no card.** É o que transforma "o agente
consertou" em "eu aprendi".

## 8. Mova para Revisão

Arraste o card para **Revisão**. Se a turma estiver trabalhando em duplas, quem
revisa é a outra pessoa.

Quer ver a orquestração de verdade? Monte o par no canvas:

1. nó **A** com a skill da tarefa (já é o que você usou);
2. nó **B** com a skill **Code Review**;
3. aresta **A → B** com a condição `sempre`;
4. aresta **B → A** com a condição `reprovado`.

Dispare em A e **não toque em mais nada**. O trabalho vai sozinho para o revisor
e volta corrigido se ele reprovar.

## 9. Done

Só depois de: build/teste passando, tela conferida, diff lido e pergunta
respondida no card.

---

## O que não fazer

- **Aceitar o diff sem ler.** O card não está feito quando o agente diz que está;
  está feito quando você entendeu o que mudou.
- **Pedir "arruma tudo".** Uma tarefa por vez. Pedido vago gera mudança larga, e
  mudança larga ninguém revisa.
- **Consertar na mão e não contar.** Se você corrigiu algo que o agente errou,
  diga no card. É informação sobre a ferramenta, e é o que a turma aprende junto.
- **Deixar dois cards em andamento.** Nenhum anda.

---

## Quando travar

Em ordem, antes de chamar o instrutor:

1. **O que aparece dentro do nó?** O app escreve os avisos com `▸`, e eles quase
   sempre dizem o que faltou.
2. **O agente está esperando resposta?** Pedido de confiar na pasta ou de
   permissão trava tudo, e só você responde.
3. **A faixa de ações mostra alguma coisa?** Se está vazia e você escolheu o
   Claude Code, o hook não subiu.
4. **O que você pediu era ambíguo?** Releia o seu último pedido como se fosse
   outra pessoa lendo.
