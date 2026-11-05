# Bateria 1 — o que falta para finalizar

Documento de passagem. Quem pegar isto deve conseguir rodar a bateria 1 do início
ao fim e dizer, no final, **se o pipeline de três agentes revisa de verdade**.

Escrito em 5 de novembro de 2026, na branch `integracao`.

---

## 1. O que a bateria precisa responder

Não é "o agente consegue escrever código". É isto:

> Um revisor que **não participou** de escrever o código consegue reprovar o que
> um agente sozinho deixaria passar?

Três números respondem. Anote os três no fim (seção 8):

1. **Quantos saltos** o pipeline deu até aprovar (contador na barra superior).
2. **O nó 3 reprovou alguma vez?** Se aprovou de primeira em todas as rodadas, ele
   não está revisando — está confiando. Esse é o resultado que invalida o pipeline.
3. **Quanto de cota foi embora** (`/usage` dentro do `agy`, antes e depois).

O terceiro decide se o pipeline de três vai para a mão dos alunos ou fica só na
demonstração do professor.

---

## 2. Onde estamos

### Já visto funcionando

- O **Papel 1** com `agy` de verdade produz um `ESPECIFICACAO.md` bom. Rodou duas
  vezes (desconto e frete). Nas duas achou a maioria dos furos plantados, decidiu
  em silêncio o mínimo e deixou *Perguntas em aberto* preenchidas.
- A mecânica do pipeline (veredito → aresta → próximo nó, freio de 20 saltos) foi
  verificada em sessão anterior com um agente de mentira, sob Playwright.
- O build (`npm run build`, que inclui `tsc --noEmit`) passa limpo.

### Ainda NÃO visto funcionando — é isto que a bateria tem de confirmar

Foi tudo escrito e compilado, mas **ninguém assistiu ao fluxo completo com agente
real depois das últimas mudanças**. Trate como hipótese:

| # | Hipótese | Como confirmar |
|---|---|---|
| 1 | O botão **Começar** entrega skill + protocolo + tarefa num prompt só, e o agente grava o status ao terminar | o terminal escreve `▸ APROVADO: …` |
| 2 | O veredito do nó 1 acorda o nó 2 sozinho, e o botão Começar dele some | idem, no nó 2 |
| 3 | O documento anunciado nasce **ligado** ao nó 1 e ao nó 2 por linha pontilhada dourada | olhar o canvas |
| 4 | O nó 3 reprova ao menos uma vez | ver o `reason` dele |
| 5 | A aresta 3 → 1 devolve o trabalho, e o Papel 1 faz a rodada de correção | seção 5 |
| 6 | As skills novas de rodada de correção (papéis 1, 2 e 3) são obedecidas | ler os `reason` da segunda rodada |

Os itens 1–3 já falharam uma vez por um motivo diagnosticado e corrigido (ver
seção 6). O 5 e o 6 **nunca rodaram**: as skills de correção foram escritas
na mesma sessão e não foram exercitadas.

### Nunca rodado

`node minicurso/medir-agy.mjs` — mede em quantas de 5 tentativas o `agy` grava o
status sozinho, sem ser lembrado. Precisa de login do Google. Sem hook como o do
Claude Code, o veredito do `agy` depende de o modelo obedecer. É o número mais
importante que ainda não existe.

---

## 3. Antes de começar

- [ ] `git pull origin integracao` em `C:\minicurso\repo`.
- [ ] **Pasta limpa.** `minicurso\bateria-1-descontos\` deve conter só
      `.gitignore`, `LEIA-ME.md` e `package.json`. Rodadas anteriores deixaram lá
      arquivos **não rastreados** (`ESPECIFICACAO.md`, `PEDIDO.md`, `descontos.js`,
      `descontos.test.js`). Apague-os: com trabalho pela metade, o Papel 1 acha o
      serviço pronto e a medição não vale.
- [ ] **`agy` logado.** Abra `agy` uma vez numa janela à parte e conclua o
      assistente de primeiro uso. Enquanto ele estiver na tela, o agente não lê o
      prompt inicial e o pipeline parece quebrado sem estar. A janela de login do
      Google dura ~60 s.
- [ ] **`/usage` dentro do `agy`, e anote.** Esse é o número de partida.
- [ ] **Um app por vez.** Há trava de instância única: com o iFlow aberto, abrir
      outro faz o processo novo morrer calado.

Para abrir, de qualquer janela do PowerShell:

```powershell
cd C:\minicurso\repo
.\iniciar.ps1
```

Ele atualiza, instala se faltar e abre o app apontado para a pasta da bateria 1.

> **Não edite código com o app aberto.** O dev server faz hot reload, e recarregar
> remonta o xterm — a tela de todos os terminais fica em branco no meio do teste
> (o processo continua vivo; só o que estava visível some). Se precisar mexer no
> código, feche o app, mexa e abra de novo.

---

## 4. Montagem, passo a passo

1. O canvas abre **vazio**. Clique em **Novo Terminal**.
2. Escolha **Antigravity CLI** na seção *Agente de IA* e a skill do papel.
   **Deixe a caixa "Começar a trabalhar já" desmarcada.** Ela vem desmarcada.
3. Repita três vezes: **Papel 1 — Especificar**, **Papel 2 — Codar**,
   **Papel 3 — Revisar**.
4. Os três sobem com o `agy` de pé e **parados**, cada um com um botão verde
   **Começar** no cabeçalho. É o estado certo.
5. Ligue arrastando de bolinha a bolinha e **clique no rótulo de cada linha**
   (aquele `sempre` minúsculo no meio) até ficar:
   - 1 → 2: `aprovado`
   - 2 → 3: `aprovado`
   - 3 → 1: `reprovado`
6. Clique em **Começar** **só no nó 1**. Abre uma caixa: cole o pedido nela
   (seção 5) e confirme. Skill, protocolo e tarefa vão juntos.
7. **Não toque nos nós 2 e 3.** Eles acordam sozinhos quando o trabalho chega.

### O que não fazer

- **Não cole o pedido direto no terminal do nó 1.** Ele recebe a tarefa sem a
  skill e sem o protocolo: trabalha, entrega, termina em silêncio — e como não
  grava o status, nada anda. Já aconteceu.
- **Não aperte Começar nos nós 2 e 3.** Eles saem trabalhando sem tarefa, ao
  mesmo tempo que o 1. É o oposto de um pipeline.
- Não ligue 3 → 2 *junto* com 3 → 1: as duas disparam, e dois agentes mexem no
  mesmo arquivo.
- Nenhum nó pode ser ligado a si mesmo (o app recusa).

---

## 5. Os pedidos

### Pedido principal — desconto no mercado

Cole **exatamente assim**, com a informalidade. O pedido estar mal escrito é o
exercício.

> preciso muito fazer um algoritmo para validar o desconto de itens do meu
> mercado, nesses descontos quero dar 10% para compras acima de 500, 15% acima
> de 1000, e 20% acima de 2000. compras abaixo de 100 terão um desconto
> randômico calculado entre 1% e 9%

Cinco furos plantados. O Papel 1 deveria achar pelo menos três:

1. **A faixa de 100 a 500 não existe.** Quem gasta 300 leva quanto?
2. **As bordas são ambíguas.** 500 entra em "acima de 500"? E 1000 exato: 10% ou 15%?
3. **Desconto randômico quebra o preço.** Dá para testar? Dá para o cliente conferir?
4. **"Desconto de itens" ou da compra?** Os limites parecem ser do total.
5. **Zero, negativo, texto.** O pedido não diz.

### Pedido de variação — frete do site

Já foi rodado **só até o Papel 1** (que achou os seis furos). Serve para uma
segunda rodada sem repetir o texto do primeiro:

> preciso de uma função pra calcular o frete do meu site, é de graça acima de 300
> reais, abaixo disso cobra 20 pro sudeste e 35 pro resto do brasil, e se for item
> pesado soma mais 15

1. 300 exato é grátis ou não? 2. O que é "item pesado"? 3. **O +15 vale quando o
frete é grátis?** (o melhor dos seis) 4. Sudeste identificado como — CEP, sigla,
nome? 5. Total do carrinho ou por item? 6. Zero, negativo, texto.

---

## 6. O que observar em cada nó

**Nó 1.** Gravou o `ESPECIFICACAO.md`? Tem *Perguntas em aberto* preenchida, ou
decidiu tudo em silêncio? O nó de documento apareceu no canvas **ligado a ele**?
Gravou o status (`▸ APROVADO: …` no terminal)?

**Nó 2.** Acordou sozinho? Implementou a faixa que ninguém pediu? Disse no `reason`
as decisões que tomou além da especificação? Os testes cobrem as bordas (500,
1000, 2000, 100) ou só os números do exemplo?

**Nó 3 — a prova.** Ele deveria:

- rodar os testes **ele mesmo** (`npm test`);
- **inventar um valor que não está na especificação** (300, ou 1000 exato) e
  conferir na mão;
- reprovar se o papel 2 resolveu uma pergunta em aberto sem anunciar.

Se o nó 3 aprovar sem citar nenhum número que ele próprio escolheu, ele não
revisou.

### Segunda rodada

Se o nó 3 reprovar, o trabalho volta ao nó 1 — e aí entram as skills de
correção, **nunca exercitadas**. Confira:

- o Papel 1 diz de quem foi a falha (especificação ambígua ou código errado) e
  acrescenta uma seção `# Rodada 2` no `ESPECIFICACAO.md`, **sem escrever código**?
- o Papel 2 escreve primeiro um teste que **falha** reproduzindo o ponto apontado,
  e depois corrige com a menor mudança — sem apagar nem afrouxar teste?
- o Papel 3 confere os pontos antigos **e** revisa tudo de novo, e se reprovar o
  mesmo ponto duas vezes escreve isso com todas as letras no `reason`?

Se o pipeline girar até o aviso de limite (20 saltos), **isso é um resultado**, não
um defeito: a tarefa não estava clara o bastante, ou as skills não seguram o laço.
Anote o que estava reprovando.

---

## 7. Se algo falhar

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| O agente trabalhou, entregou e **nada andou** | ele não recebeu o protocolo (pedido colado direto no terminal) ou terminou sem gravar o status — o `agy` não tem hook, depende de obediência | grave o JSON na mão (abaixo) |
| Botão Começar continua nos três nós | ninguém clicou, ou o prompt foi digitado fora da caixa | clique em Começar no nó 1 |
| O nó 2 não acordou depois do `▸ APROVADO` | aresta ainda em `sempre`/`reprovado`, ou nó de destino inativo | confira o rótulo da aresta; o terminal do nó 1 diz o motivo |
| `▸ Fim do pipeline (nenhuma conexão para seguir)` | não há aresta saindo do nó com a condição do veredito dele | é o comportamento esperado no nó 3 aprovando |
| Tela dos terminais ficou em branco | hot reload (alguém mexeu no código) | o trabalho está em disco; reabra o app |
| Ctrl+V não cola | versão antiga do app | `git pull` e reabra |
| Documento não aparece ligado ao nó | o agente omitiu o campo `from` | com **um** agente trabalhando o app atribui sozinho; com vários, fica solto |
| O agente travou no assistente de primeiro uso | `agy` nunca foi aberto à mão | abra `agy` numa janela à parte |

### Gravar o status na mão

O caminho está no prompt que o agente recebeu (bloco *Protocolo de orquestração*).
O formato:

```json
{ "status": "approved", "reason": "uma frase", "files": ["descontos.js"] }
```

Vai em `%APPDATA%\iflow\pipeline-status\<id-do-terminal>.json`. Use `rejected` no
lugar de `approved` para devolver. O app lê, roteia e apaga o arquivo.

**Cuidado com a codificação:** salve em UTF-8 **sem BOM**. No PowerShell 5.1,
`Set-Content -Encoding UTF8` grava BOM, e o parser recusa.

---

## 8. Resultado — preencher no fim

| | Pedido do desconto | Pedido do frete (opcional) |
|---|---|---|
| Saltos até aprovar | | |
| O nó 3 reprovou? Quantas vezes? | | |
| De quê (o que ele apontou) | | |
| `/usage` antes → depois | | |
| O Papel 1 achou quantos dos furos? | | |
| O pipeline parou sozinho no limite? | | |
| O status foi gravado sem lembrete? | | |

Cole a tabela preenchida num commit em `minicurso/RESULTADO-BATERIA-1.md`.

**Como ler:** se o nó 3 nunca reprovou, desconfie dele antes de confiar no nó 2.
Se o `agy` esqueceu de gravar o status em mais de uma de cada cinco vezes, o
pipeline não é confiável para ir às mãos de 30 alunos sem o professor ao lado.

---

## 9. Para consultar

| | Onde |
|---|---|
| Roteiro das duas baterias | `minicurso/BATERIAS-DE-TESTE.md` |
| Montagem do pipeline | `minicurso/PIPELINE-3-AGENTES.md` |
| As skills dos três papéis | `skills/papel-{1,2,3}-*.md` (já aparecem no seletor) |
| Medir a obediência do `agy` | `minicurso/medir-agy.mjs` |
| Contexto completo do projeto | `CONTEXTO-COMPLETO.md` |
| Pendências fora da bateria | `O-QUE-FALTA.md` |

Fora desta bateria, continuam em aberto: proteger a `main` do `virta-minicurso`,
rotacionar as credenciais que passaram pelo chat dentro do zip do virta, e a
bateria 2 (uma tarefa do virta).
