# Duas baterias para validar o pipeline de três agentes

O objetivo não é ver o agente produzir código. É ver **se o pipeline pega o que
um agente sozinho deixaria passar**. Por isso cada bateria tem um gabarito: o
que um bom papel 1 deveria perguntar, e o que um bom papel 3 deveria reprovar.

Se o papel 3 aprovar tudo de primeira nas duas baterias, o pipeline não está
funcionando — está só passando trabalho adiante.

## Montagem (igual para as duas)

Três terminais, nesta ordem, cada um com a sua skill:

| Nó | Skill | Agente |
|---|---|---|
| 1 | Papel 1 — Especificar | Antigravity CLI |
| 2 | Papel 2 — Codar | Antigravity CLI |
| 3 | Papel 3 — Revisar | Antigravity CLI |

Arestas: **1 → 2 (aprovado)**, **2 → 3 (aprovado)**, **3 → 1 (reprovado)**.
Clique no rótulo de cada linha para trocar a condição.

Aponte a pasta de trabalho antes de abrir o app:

```powershell
$env:AGENT_ORCHESTRATOR_SKILLS_DIR  = "$orq\minicurso\skills-virta"
$env:AGENT_ORCHESTRATOR_TERMINAL_CWD = "$orq\minicurso\bateria-1-descontos"
npm run dev
```

---

# Bateria 1 — o algoritmo de desconto

Cole **no nó 1**, exatamente assim (os furos são de propósito):

> preciso muito fazer um algoritmo para validar o desconto de itens do meu
> mercado, nesses descontos quero dar 10% para compras acima de 500, 15% acima
> de 1000, e 20% acima de 2000. compras abaixo de 100 terão um desconto
> randômico calculado entre 1% e 9%

## Gabarito: os furos que estão aí de propósito

Cinco. O papel 1 deveria achar pelo menos três.

**1. A faixa de 100 a 500 não existe.** As regras cobrem "abaixo de 100" e
"acima de 500". Quem gasta 300 leva quanto? O pedido não diz. Esse é o furo
mais fácil e o mais revelador: um agente apressado assume "0%" sem avisar.

**2. As bordas são ambíguas.** "Acima de 500" inclui 500? E 100, que é o topo
de uma faixa e o pé de um buraco? Uma compra de exatamente 1000 leva 10% ou 15%?

**3. Desconto randômico quebra o preço.** Se o desconto é sorteado, a mesma
compra dá um valor diferente a cada vez que a tela recarrega. Dá para testar?
Dá para o cliente conferir a conta? Essa é a pergunta que o papel 1 deveria
levantar — e que um agente sozinho implementa sem pestanejar.

**4. "desconto de itens" ou da compra?** O pedido fala em "desconto de itens do
meu mercado", mas os limites (500, 1000, 2000) parecem ser do total da compra.
Por item ou por carrinho? Muda tudo.

**5. Valores inválidos.** Zero, negativo, texto. Nada no pedido fala disso.

## O que observar em cada nó

**Nó 1** — abriu o `ESPECIFICACAO.md`? Tem *Perguntas em aberto* preenchida, ou
ele decidiu tudo sozinho em silêncio? O documento apareceu no canvas?

**Nó 2** — implementou a faixa 100–500 que ninguém pediu? Disse no `reason`
quais decisões tomou além da especificação? Os testes cobrem as bordas ou só
500, 1000 e 2000?

**Nó 3** — esta é a prova. Ele deveria:
- rodar os testes **ele mesmo**;
- inventar um valor que não está na especificação (ex.: 300, ou 1000 exato) e
  conferir na mão;
- reprovar se o papel 2 resolveu uma *Pergunta em aberto* sem anunciar.

Se o nó 3 aprovar sem citar nenhum número que ele próprio escolheu, ele não
revisou — ele confiou.

---

# Bateria 2 — uma tarefa do virta

Mesma montagem, trocando a pasta de trabalho para o fork do virta:

```powershell
$env:AGENT_ORCHESTRATOR_TERMINAL_CWD = "C:\minicurso\workspace\virta-front-end"
```

Cole **no nó 1** o corpo de uma issue de
https://github.com/Minicurso-Maestro-IA/virta-minicurso/issues

Sugestão para a primeira rodada: a **issue 1** (a lista mente sobre entrada e
saída). Ela tem dois defeitos no mesmo trecho — sinal e cor — e o erro típico é
consertar um e declarar pronto. É o cenário exato que o papel 3 existe para
pegar.

## O que muda em relação à bateria 1

Aqui já existe código, então o papel 1 tem obrigação a mais: **reproduzir o
defeito** antes de especificar. Se ele escrever a especificação sem abrir o
`WalletTransactions.tsx`, está adivinhando.

E o *Pronto quando* da issue já vem escrito. O papel 1 deve copiá-lo para a
especificação, não reinventá-lo.

## O que observar

- o papel 1 abriu o arquivo citado na issue, ou só releu a issue?
- o papel 2 rodou `npm run build`? (ele passa mesmo com o defeito — é esse o
  ponto da aula)
- o papel 3 **olhou a tela**, ou aprovou porque compilou?
- o papel 3 pegou o segundo defeito, se o papel 2 consertou só um?

---

# Anotando o resultado

Para cada bateria, anote três coisas:

1. **Quantos saltos** o pipeline deu até aprovar (o contador na barra).
2. **O papel 3 reprovou alguma vez?** Se nunca reprovou nas duas baterias,
   desconfie dele antes de confiar no papel 2.
3. **Quanto de cota** foi consumido (`/usage` no agy antes e depois).

O terceiro número é o que decide se o pipeline de três vai para a mão dos
alunos ou fica só na sua demonstração.
