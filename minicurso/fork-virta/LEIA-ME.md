# Fork do virta para a aula

Três arquivos do `virta-front-end` com **seis defeitos visuais plantados de
propósito**. Cada um é uma tarefa: o aluno vê a tela errada, conserta com o
agente, e vê a tela certa. É o ciclo mais curto de aprendizado que existe.

Só os arquivos alterados estão aqui. O resto do projeto é o virta original.

---

## Como montar o fork

**1. Copie o virta inteiro** para uma pasta nova — não mexa no original:

```powershell
Copy-Item -Recurse C:\Users\Lucas\WebstormProjects\virta\virta-front-end C:\minicurso\workspace\virta-front-end
```

**2. Sobrescreva os três arquivos** com os desta pasta:

```powershell
$fork = "C:\minicurso\repo\minicurso\fork-virta\front\src"
$alvo  = "C:\minicurso\workspace\virta-front-end\src"
Copy-Item "$fork\components\CategoryBadge.tsx"            "$alvo\components\"           -Force
Copy-Item "$fork\components\wallet\WalletTransactions.tsx" "$alvo\components\wallet\"   -Force
Copy-Item "$fork\pages\DashboardPage.tsx"                  "$alvo\pages\"               -Force
```

**3. Rode** (`npm install` e `npm run dev` na pasta do fork) com o backend do
virta no ar. Crie duas ou três transações, sendo uma receita, uma despesa e uma
com descrição bem longa — é o que faz os seis defeitos aparecerem na tela.

---

## Os seis defeitos

Esta lista é para **você**, instrutor. O aluno recebe uma tarefa por vez.

| # | O que se vê | Arquivo | Tarefa |
|---|---|---|---|
| 1 | Despesa com `+` na frente do valor | `WalletTransactions.tsx` | V1 |
| 2 | Todo valor em verde, inclusive despesa | `WalletTransactions.tsx` | V1 |
| 3 | Data como `2026-01-15` | `WalletTransactions.tsx` | V2 |
| 4 | Valor como `1234.5` | `WalletTransactions.tsx` | V2 |
| 5 | Descrição longa empurra valor e botões para fora | `WalletTransactions.tsx` | V3 |
| 6 | Toda etiqueta de categoria cinza | `CategoryBadge.tsx` | V4 |
| 7 | Gráficos com receita em vermelho | `DashboardPage.tsx` | V5 |

### Decisões que tomei ao plantar

**Nada quebra o build.** Era tentador deixar os formatadores importados e sem
uso, mas o `tsc -b` do virta reprovaria e o aluno nem chegaria a ver a tela. O
import foi removido junto — que também é o erro mais realista: quem não sabe que
o helper existe não o importa.

**A cor da categoria não virou uma constante cinza.** Isso deixaria a prop
`color` sem uso e o compilador reclamaria. Virou `"#71717a" ?? color`: compila,
não gera aviso, parece certo numa leitura rápida e sempre devolve cinza. É o tipo
de linha que passa despercebida em revisão — e por isso ensina mais.

**Os defeitos se contradizem na tela.** A seta da transação continua certa
enquanto a cor e o sinal mentem. O aluno percebe o conflito antes de entender a
causa, que é exatamente como se encontra bug de verdade.

---

## As tarefas

Estão em `minicurso/skills-virta/virta-visual-*.md`. Para o app oferecê-las no
seletor, copie-as para a pasta `skills` ao lado do exe:

```powershell
Copy-Item C:\minicurso\repo\minicurso\skills-virta\*.md C:\minicurso\repo\release\win-unpacked\skills\ -Force
```

Ou aponte a variável para a pasta e evite copiar:

```powershell
setx AGENT_ORCHESTRATOR_SKILLS_DIR C:\minicurso\repo\minicurso\skills-virta
```

**Sugestão de ordem:** V1 (mais visível), V4 (a linha mais traiçoeira), V2 (fala
de reúso, não de escrever código), V5 (leva à ideia de fonte única), V3 (a mais
difícil: exige entender como flex encolhe).

---

## O que eu não pude verificar

O zip que recebi trouxe só `src` e `package.json`. Sem `vite.config.ts`,
`index.html`, `tsconfig.json` e `public/`, não consegui compilar nem rodar o
front aqui. As alterações são pequenas e cirúrgicas — dá para conferir uma a uma
pelo diff — mas **quem roda primeiro é você**.

Se algo não compilar, me mande o erro: é edição de poucas linhas e o conserto é
rápido.
