# Contexto completo — minicurso de IA generativa

Documento de passagem. Quem ler isto deve conseguir continuar o trabalho sem
nada do histórico anterior.

Escrito em 5 de novembro de 2026.

---

## 1. O que é

Um minicurso de IA generativa para **~30 alunos**, num laboratório de
informática do IFPR, com duração de **1h30 a 2h**.

O desenho da aula:

1. ~30 min de teoria (o que é um LLM, previsão da próxima palavra, por que ele
   inventa).
2. Demonstração do **iFlow**, um orquestrador de agentes de IA.
3. Os alunos recebem um fork do **virta** (um app de controle financeiro real,
   da empresa do professor) com **defeitos visuais plantados de propósito**.
4. Quatro grupos de 4-5 pessoas. **Cada grupo escreve uma tarefa, e outro grupo
   executa** — rotação 1→2→3→4→1.
5. Os agentes trabalham durante o intervalo.
6. Revisão final com pensamento crítico.

**O objetivo pedagógico não é "a IA escreve código".** É que o aluno descubra
que o código compila, os testes passam, e a tela continua errada — e que quem
confere é ele. Toda decisão de projeto abaixo serve a isso.

---

## 2. Os dois repositórios

### `Minicurso-Maestro-IA/agent-orchestrator` — o app (iFlow)

Clone local: **`C:\minicurso\repo`**

| Branch | O que é |
|---|---|
| `main` (`429703e`) | trabalho do Eliandro Gomes: identidade iFlow, redesign do canvas e da barra, conserto da aresta, detecção de CLI digitada, versão 1.1.0 |
| `integracao` | **a branch boa.** Parte da `main` e acrescenta o material da aula. 7 commits à frente. |
| `claude/empacotar-exe-minicurso` | branch antiga, **histórico órfão** (sem ancestral comum com a `main`). Já foi aproveitada; pode ser apagada. |

### `Minicurso-Maestro-IA/virta-minicurso` — o app dos alunos

Publicado em **https://minicurso-maestro-ia.github.io/virta-minicurso/**
Entrar: `maria@virta.com` / `123456`

---

## 3. O iFlow, por dentro

Electron + React 19 + React Flow (`@xyflow/react`) + xterm.js + node-pty +
Zustand. Um canvas espacial onde cada nó é um terminal de verdade, opcionalmente
rodando uma CLI de IA.

### O pipeline

Nós se ligam por **arestas condicionais**. Cada aresta dispara em `sempre`,
`aprovado` ou `reprovado` — e o rótulo no meio da linha é um **botão** que cicla
entre os três.

O mecanismo: o agente, ao terminar, grava um JSON no caminho que recebeu em
`ORCHESTRATOR_STATUS_FILE`:

```json
{ "status": "approved", "reason": "<uma frase>", "files": ["<arquivos>"] }
```

O `pipeline-watcher` (polling de arquivo) vê, emite para o renderer, e o
**store do renderer** decide o roteamento, porque é ele quem conhece as arestas.
O nó de destino recebe o `reason` como prompt.

Freio: **20 saltos** (`MAX_HOPS`), depois pausa sozinho. Verificado: um revisor
que nunca aprova para em ~50 s.

### Por que o veredito é frágil, e o que foi feito

O protocolo depende do modelo **obedecer**. Com o Claude Code existe um hook
`Stop` (`hooks/claude-stop.cjs`) que grava o status mesmo se o modelo esquecer —
é a única CLI do catálogo onde o veredito não depende de obediência. Com o `agy`
não há hook.

`minicurso/medir-agy.mjs` existe para medir exatamente isso: de 5 tentativas,
em quantas o `agy` grava o status sozinho. **Nunca foi rodado** — precisa de
login do Google, que não dá para fazer de um contêiner.

### Outros canais agente → app

Gravando JSON em `ORCHESTRATOR_EVENTS_DIR`:

- `{ "document": "<caminho.md>", "intent": "..." }` → vira um nó de documento no
  canvas. **Verificado funcionando.**
- `{ "spawn": "Revisor", "from": "<id>", "task": "..." }` → cria outro agente
  ligado a quem pediu. Não testado com agente real.

E `hooks/claude-trace.cjs` (PostToolUse) grava uma linha JSONL por ação em
`ORCHESTRATOR_TRACE_FILE`, que vira a **tira de ações** no nó — "leu api.ts",
"rodou npm test". É o que a turma acompanha de longe.

### Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `AGENT_ORCHESTRATOR_SKILLS_DIR` | pasta das skills (.md) do seletor |
| `AGENT_ORCHESTRATOR_AGENTS_FILE` | catálogo de CLIs alternativo |
| `AGENT_ORCHESTRATOR_TERMINAL_CWD` | pasta onde todo terminal novo nasce |
| `AGENT_ORCHESTRATOR_WATCH_DIR` | pasta observada para .md virarem nós |

---

## 4. O virta-minicurso, por dentro

É o **virta de verdade** — nenhum componente, service ou contexto foi alterado.
O que mudou foi quem responde: `src/mock/servidor.ts` intercepta o
`window.fetch` e responde as rotas da API Spring a partir de um "banco" no
`localStorage` (`src/mock/dados.ts`).

A interceptação é no `fetch`, e não em cada service, de propósito: o app faz
rede em quatro lugares diferentes, e remendar os quatro significaria alterar
justamente o código que os alunos vão ler.

### Os 7 defeitos plantados

Todos **visuais**, todos compilam, nenhum quebra teste:

| Arquivo | Defeito |
|---|---|
| `src/components/wallet/WalletTransactions.tsx` | sinal invertido (`{income ? "-" : "+"}`) |
| idem | cor única (os dois ramos do ternário devolvem `text-emerald-600`) |
| idem | data crua (`{tx.date}`) e valor cru (`{tx.amount}`) — o `import` de `format.ts` foi apagado |
| idem | descrição longa estoura a linha (`truncate` e `min-w-0` removidos) |
| `src/components/CategoryBadge.tsx` | etiqueta cinza, mas a **bolinha mantém a cor certa** — a contradição é a pista |
| `src/pages/DashboardPage.tsx` | `INCOME_COLOR` e `EXPENSE_COLOR` trocados no gráfico de barras |

Em 1, 2 e 6 a lista de últimas transações do **Dashboard** é a versão correta do
mesmo código — dá para consertar comparando dois arquivos.

### As 8 tarefas

Em https://github.com/Minicurso-Maestro-IA/virta-minicurso/issues — cinco de
defeito plantado e três de melhoria, todas com quatro seções (O sintoma / Onde
olhar / Pronto quando / **A pergunta**).

---

## 5. O que foi verificado, e como

Tudo abaixo foi testado de verdade, não presumido:

- **Pipeline de 3 nós**: app Electron rodando sob xvfb, dirigido por
  Playwright, com um agente de mentira que grava o status sem chamar modelo.
  Seis execuções, cinco saltos, a aresta `3 → reprovado → 1` dispara, e um
  revisor que nunca aprova para no limite de 20.
- **Nó de documento**: o anúncio via JSON cria o nó no canvas.
- **Empacotamento**: zip e portable gerados; conferido que `agents.json`,
  `skills/`, `hooks/`, `instalar.mjs`, `LEIA-ME.txt` e `projeto-exemplo/` caem
  **ao lado do exe**, e que o `node-pty` fica fora do asar.
- **O site do virta**: as 8 rotas renderizam, zero erro de JS, login funciona,
  cadastro funciona (com senha forte), o perfil é do usuário certo.
- **BOM quebra o `agy`**: testado no binário — `invalid character '\ufeff'`.
- **`npm i -g agy` é o pacote errado**: 217 bytes, 2 arquivos, de 2022, de outro
  mantenedor. O Antigravity é binário, instalado pelo script do Google.

### O que NÃO foi verificado

- **Nada com o `agy` de verdade.** Nenhum agente real rodou no pipeline. O login
  do Google tem janela de 60 segundos e não atravessa uma conversa.
- **Nada no Windows.** Todo teste foi em Linux. ConPTY, caminhos com espaço e
  PowerShell 5.1 são hipóteses, não fatos.
- **O ícone no `.exe`.** Empacotando em Linux o `rcedit` não roda, então sai o
  ícone genérico. Precisa empacotar no Windows.

---

## 6. O que testar agora: duas baterias

Roteiro completo em `minicurso/BATERIAS-DE-TESTE.md`. Resumo:

Três nós — **Papel 1 — Especificar**, **Papel 2 — Codar**, **Papel 3 —
Revisar** — ligados `1→2` (aprovado), `2→3` (aprovado), `3→1` (reprovado).

O chat 3 nunca veria o pedido original, porque o único canal entre nós é o
`reason`. Por isso o papel 1 grava um **`ESPECIFICACAO.md`** e anuncia no
canvas; os papéis 2 e 3 leem o mesmo arquivo.

### Bateria 1 — algoritmo de desconto

Pasta: `minicurso\bateria-1-descontos` (vazia de propósito, `npm test` pronto).

Pedido a colar no nó 1:

> preciso muito fazer um algoritmo para validar o desconto de itens do meu
> mercado, nesses descontos quero dar 10% para compras acima de 500, 15% acima
> de 1000, e 20% acima de 2000. compras abaixo de 100 terão um desconto
> randômico calculado entre 1% e 9%

**Cinco furos de propósito**: a faixa 100–500 não existe; as bordas são
ambíguas (1000 exato é 10% ou 15%?); desconto randômico torna o preço
irreproduzível; "desconto de itens" ou da compra?; zero e negativo não são
mencionados.

### Bateria 2 — uma tarefa do virta

Mesma montagem, `-Pasta C:\minicurso\workspace\virta-front-end`, colando o corpo
de uma issue. Sugestão: a issue 1, que tem dois defeitos no mesmo trecho — o
erro típico é consertar um e declarar pronto.

### Como pontuar

1. Quantos **saltos** até aprovar (contador na barra).
2. **O nó 3 reprovou alguma vez?** Se nunca reprovou nas duas baterias, ele não
   está revisando — está confiando.
3. Quanto de **cota** foi embora (`/usage` no `agy` antes e depois).

---

## 7. Armadilhas que já custaram tempo

**Assistente de primeiro uso do `agy`.** Enquanto está na tela, o agente não lê
o prompt inicial e o pipeline não anda. Parece defeito do app. Abra `agy` uma
vez na mão em cada máquina.

**O ícone só entra no `.exe` empacotando no Windows** (`rcedit`).

**Desbloqueie o zip antes de extrair.** O Mark-of-the-Web passa para cada
arquivo extraído e é o que faz o aviso reaparecer.

**O rótulo da aresta é um botão.** Precisa estar no slide.

**O canvas não é salvo.** Fechou, perdeu nós e arestas.

**PowerShell 5.1 ≠ 7.** O 5.1 não aceita `&&`, corrompe acentos em argumentos
de linha de comando (por isso os `skillArgs` são ASCII), e `Set-Content
-Encoding UTF8` grava BOM.

**Duas configurações do electron-builder.** Com `electron-builder.yml` e o bloco
`build` no `package.json` juntos, ele lê o `package.json` e **ignora o `.yml` em
silêncio**. Hoje existe só o do `package.json` — não recrie o `.yml`.

**Login do virta:** `/cadastro` (não `/register`), senha forte exigida no
cadastro. "Credenciais inválidas" com a senha certa costuma ser cache:
`Ctrl+Shift+R`, e depois apagar `virta-aula-banco-v1` e `virta.session`.

---

## 8. Decisões de projeto, e por quê

Para não serem desfeitas por engano:

- **Protocolo por arquivo, não por marcador na tela.** A saída do PTY quebra em
  80 colunas e vem cheia de códigos ANSI.
- **`delivery: 'arg'` com `{promptFile}`**, não `paste`. O `paste` espera um
  tempo fixo e cola torcendo para a CLI já ter subido.
- **`asar` ligado com `asarUnpack` do node-pty**, não `asar: false`. O ConPTY
  carrega uma DLL de verdade, que não carrega de dentro do archive.
- **`extraFiles`** põe `agents.json` e `skills/` ao lado do exe — é onde os
  registries procuram e onde o aluno consegue editar.
- **`npmRebuild: false`.** node-pty é Node-API com prebuild win32-x64; com o
  rebuild ligado o node-gyp aborta.
- **As skills de papel dizem o que NÃO fazer.** Um revisor que conserta o que
  achou apaga a evidência de que havia erro, e o pipeline vira enfeite.

---

## 9. Pendências

Ver `O-QUE-FALTA.md`, no mesmo repositório. O item mais antigo e urgente:
**rotacionar as credenciais** (`spring.datasource.password`,
`api.security.token.secret`, `brevo.api-key`) que passaram por um chat dentro de
um zip do virta.

---

## 10. Como abrir

```powershell
cd C:\minicurso\repo
.\iniciar.ps1
```

O script acha o repositório, atualiza, instala se faltar, aponta as variáveis e
abre o app. `-Pasta` troca a pasta de trabalho dos terminais; `-Raiz` pula a
busca.
