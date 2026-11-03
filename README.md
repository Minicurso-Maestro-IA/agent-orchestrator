# Agent Orchestrator 🛸

Workspace desktop com **Canvas Espacial 2D infinito** capaz de orquestrar múltiplos terminais nativos e agentes de IA em nós conectáveis e arrastáveis.

---

## 🛠️ Stack Tecnológica (Fase 1 MVP)

- **Electron 34+** com `electron-vite` (Main, Preload e Renderer unificados com TypeScript)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **@xyflow/react** (React Flow v12) para o canvas espacial 2D infinito
- **@xterm/xterm** + **@xterm/addon-fit** (renderer DOM, para o texto continuar nítido em qualquer nível de zoom do canvas)
- **node-pty** (sessões PTY nativas no Windows ConPTY, WSL e Linux)
- **Zustand** para gerenciamento de estado espacial
- **Lucide React** para iconografia

---

## 📂 Arquitetura do Projeto

```
agent-orchestrator/
├── src/
│   ├── main/
│   │   ├── index.ts                # Inicialização da janela Electron e ciclo de vida
│   │   ├── core/
│   │   │   ├── pty-manager.ts      # Gerenciador de processos PTY nativos (PowerShell, CMD, WSL)
│   │   │   ├── skill-registry.ts   # Descobre e lê as skills de skills/*.md
│   │   │   └── agent-registry.ts   # Lê o catálogo de CLIs de agents.json
│   │   └── ipc/
│   │       └── terminal.ipc.ts     # Handlers IPC e broadcast de eventos para o Renderer
│   ├── preload/
│   │   ├── index.ts                # Exposição da API tipada via contextBridge ('orchestrator')
│   │   └── index.d.ts              # Declarações globais do preload
│   ├── renderer/
│   │   ├── index.html              # Template HTML principal
│   │   └── src/
│   │       ├── main.tsx            # Ponto de entrada do React 19
│   │       ├── App.tsx             # Provedor do React Flow
│   │       ├── index.css           # Estilos globais (Tailwind v4, React Flow, XTerm)
│   │       ├── env.d.ts            # Tipagem de ambiente e window.orchestrator
│   │       ├── components/
│   │       │   ├── SpatialCanvas.tsx # Canvas infinito com dots, minimap e controls
│   │       │   ├── TerminalNode.tsx  # Nó customizado com XTerm, FitAddon, WebGL, Drag & Resize
│   │       │   └── TopBar.tsx        # Barra de ferramentas superior com seletor de shells
│   │       └── store/
│   │           └── terminalStore.ts  # Estado dos nós e integrações de terminal com Zustand
│   └── shared/
│       └── types.ts                # Tipos TypeScript compartilhados (Main, Preload, Renderer)
├── skills/                         # Uma skill por arquivo .md (ver abaixo)
├── agents.json                     # Catálogo de CLIs de IA oferecidas no seletor
├── electron.vite.config.ts         # Configuração unificada do Vite com node-pty externalizado
├── tsconfig.json                   # Configuração do TypeScript com aliases @shared/* e @renderer/*
└── package.json
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+ ou 22+ (testado no Node.js v24)
- npm ou pnpm

### Instalação de Dependências
```bash
npm install
```

### Modo de Desenvolvimento
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

---

## ✨ Recursos da Fase 1
- **Canvas Espacial Infinito**: Navegação suave com zoom, pan, grid pontilhado escuro e minimap interativo.
- **Terminais Nativos Reativos**: Nós de terminal arrastáveis pela barra de título, redimensionáveis interativamente (`NodeResizeControl` e `NodeResizer`) com auto-fit de colunas/linhas no PTY.
- **Suporte Multisshell**: PowerShell (`powershell.exe -NoLogo`), Command Prompt (`cmd.exe`) e WSL (`wsl.exe`).
- **Handles Conectáveis**: Pinos de entrada (`in`) e saída (`out`) prontos para orquestração de fios na Fase 2.
- **Texto nítido em qualquer zoom**: o terminal usa o renderer DOM do xterm. O renderer WebGL desenha num canvas de resolução fixa que o React Flow apenas reescala, o que borrava o texto ao dar zoom.
- **Conexões por qualquer lado**: handles no topo, base, esquerda e direita (`ConnectionMode.Loose`); cada aresta leva uma seta apontando para o nó que recebe.
- **Terminal com contexto**: ao criar um terminal você escolhe o shell, uma CLI de IA e uma skill. O app inicia a CLI e entrega a skill como primeiro prompt.


---

## 📦 Empacotar para a sala de aula

```bash
npm run dist:win
```

Gera `release/orquestrador-<versão>-win-x64.zip`. O aluno descompacta e clica no
exe: sem instalador e sem administrador.

```
orquestrador-1.0.0-win-x64.zip
├── Agent Orchestrator.exe
├── agents.json          ← editável pelo aluno, ao lado do exe
├── skills/              ← editável pelo aluno, ao lado do exe
└── resources/
    ├── app.asar
    └── app.asar.unpacked/node_modules/node-pty/
```

Três decisões no `electron-builder.yml` que não são cosméticas:

| Config | Por quê |
|---|---|
| `asarUnpack` do node-pty | o ConPTY carrega uma DLL de verdade de `third_party/conpty/win10-x64/`, e DLL não é carregável de dentro do asar. Sem isso o app abre e **todo** terminal falha |
| `extraFiles` (e não `extraResources`) | põe `agents.json` e `skills/` ao lado do exe, exatamente onde `agent-registry.ts` e `skill-registry.ts` procuram — e onde o aluno consegue editar |
| `npmRebuild: false` | node-pty 1.1.0 é addon **Node-API** e já publica binário pronto para `win32-x64`: não há o que recompilar. Com o rebuild ligado, o `node-gyp` aborta dizendo que não cross-compila |

Como não há nada para recompilar, o zip de Windows pode ser montado de um Linux.
Só a assinatura do executável exige wine; sem certificado ela não serve para nada,
então desligue-a nesse caso:

```bash
npx electron-builder --win --x64 -c.win.signAndEditExecutable=false
```

Essa flag também abre mão do ícone e dos metadados do exe. Buildando no Windows,
não passe a flag.

O executável não é assinado: no primeiro clique o SmartScreen avisa que o autor é
desconhecido. "Mais informações" → "Executar assim mesmo".

### Preparar as máquinas

`minicurso/preparar-maquina.ps1` faz, por máquina e sem administrador: instala o
`agy`, descompacta o app em `C:\minicurso\orquestrador`, cria a pasta de trabalho
`C:\minicurso\workspace`, aponta `AGENT_ORCHESTRATOR_TERMINAL_CWD` e
`AGENT_ORCHESTRATOR_WATCH_DIR` para ela e cria o atalho na área de trabalho.

```powershell
.\preparar-maquina.ps1 -Zip .\orquestrador-1.0.0-win-x64.zip
```

O que o script **não** automatiza, e nem dá: o assistente de primeiro uso do `agy`
e o login no navegador. São dois minutos por máquina, na mão.

### A IA gratuita, em outubro de 2026

O acesso gratuito com conta Google **saiu do Gemini CLI**: o README oficial dele diz
que foi substituído pelo Antigravity CLI em 18/06/2026 para camada gratuita e Google
One. O que restou no Gemini CLI para quem não paga é a chave de API — 250 req/dia,
só modelos Flash, e **por projeto, não por usuário**, o que não divide entre alunos.

Por isso o primeiro agente do `agents.json` é o **Antigravity CLI** (`agy`): oficial,
binário (não precisa de Node), gratuito com conta Google e TUI interativa, o que o
faz funcionar com o `delivery: "paste"` sem mexer em código.

**O limite é o ponto cego.** O Google não publica a cota do plano gratuito, só diz
"basic weekly rate limits" — e são semanais, não diárias. Rode `/usage` dentro do
`agy` numa máquina preparada e anote o número **antes** de desenhar a aula: ele
determina quantos turnos de agente por aluno a turma aguenta. Se for apertado, cada
aluno com a própria conta Google multiplica a cota, e o Ollama local serve de plano B
sem conta e sem internet.

---

## 🧠 Terminais com contexto (skills + IA)

Ao criar um terminal você escolhe três coisas na barra superior: **Shell**, **IA** e **Skill**.
Com uma IA selecionada, o app abre o shell, inicia a CLI escolhida e entrega a skill
como primeiro prompt.

### Skills

Cada skill é um arquivo `.md` em `skills/`. O frontmatter é opcional:

```markdown
---
name: Code Review
description: Revisa o diff atual procurando bugs de correção
---

# Code Review

Você é um revisor de código criterioso...
```

Sem `name`, o app usa o primeiro `# título` do arquivo; sem esse, o nome do arquivo.
Para apontar para outra pasta, defina `AGENT_ORCHESTRATOR_SKILLS_DIR`.

### Agentes

O catálogo vive em `agents.json`, editável sem recompilar — as CLIs mudam de flags
com frequência:

```json
{
  "agents": [
    {
      "id": "claude",
      "label": "Claude Code",
      "command": "claude",
      "delivery": "paste",
      "readyDelayMs": 4000,
      "install": "npm i -g @anthropic-ai/claude-code"
    }
  ]
}
```

| Campo | O que faz |
|---|---|
| `command` / `args` | O que é digitado no shell para subir a CLI |
| `delivery` | `paste` cola a skill como primeiro prompt (bracketed paste, serve para qualquer CLI interativa). `arg` passa a skill via `skillArgs` |
| `skillArgs` | Usado com `delivery: "arg"`. Placeholders: `{skillFile}`, `{skillName}` |
| `readyDelayMs` | Quanto esperar a CLI subir antes de entregar a skill |
| `install` | Mostrado no terminal quando o comando não existe |

Para apontar para outro arquivo, defina `AGENT_ORCHESTRATOR_AGENTS_FILE`.

As CLIs **não** são instaladas pelo projeto. Instale a que for usar antes de
selecioná-la, por exemplo `npm i -g @anthropic-ai/claude-code`.


---

## 🔀 Pipeline de agentes (aprovação e reprovação)

As conexões entre terminais não são decorativas: elas roteiam trabalho. Clique no
rótulo de uma aresta para alternar em qual veredito ela dispara:

| Rótulo | Dispara quando |
|---|---|
| `sempre` | o agente de origem termina, com qualquer veredito |
| `aprovado` | o agente de origem aprovou |
| `reprovado` | o agente de origem reprovou |

Isso permite montar o fluxo clássico: **codifica → revisa**, com a revisão voltando
ao autor quando reprova e seguindo para o deploy quando aprova.

### Como o agente sinaliza

Ao iniciar um agente, o app injeta na skill um bloco de protocolo e define a
variável de ambiente `ORCHESTRATOR_STATUS_FILE` no terminal. O agente grava ali,
como última ação do turno:

```json
{ "status": "approved", "reason": "uma frase", "files": ["src/api.ts"] }
```

Usa-se arquivo em vez de um marcador na saída do terminal porque a saída do PTY
quebra em 80 colunas e vem misturada com códigos ANSI — detectar texto ali é
frágil. O arquivo é imune a isso e carrega dados estruturados. Assim que lido, o
arquivo é apagado; é isso que impede o mesmo veredito de disparar o roteamento
mais de uma vez.

O orquestrador escreve o veredito na tela do terminal e entrega ao destino um
prompt contextualizado, dizendo de onde veio e o que foi pedido.

### Proteção contra laço

Reprovar → corrigir → reprovar pode girar indefinidamente queimando crédito de API.
Após 20 saltos o pipeline pausa sozinho e aparece um aviso na barra superior com
um botão **Retomar**.


---

## 🔁 Estado do nó, entrega por arquivo e agentes que criam agentes

### Estado do nó

Cada nó de terminal mostra no cabeçalho o que está fazendo: **trabalhando** (saindo
saída agora), **ocioso** (sessão viva, calada) ou **encerrado**. O estado vem do
fluxo de bytes do PTY, com 1,2 s de silêncio separando "trabalhando" de "ocioso".

Não existe um estado "esperando o usuário": distinguir isso de "parado" exigiria
interpretar a tela, que muda a cada versão de cada CLI. O que está aqui é o que dá
para afirmar sem adivinhar.

### Entrega do contexto por arquivo

Antes, o app subia a CLI, esperava `readyDelayMs` e colava a skill torcendo para a
CLI já estar pronta. Quando a máquina estava lenta, o texto caía no vazio.

Agora, uma CLI que aceita prompt inicial recebe o caminho de um arquivo pronto:

```json
{
  "id": "antigravity",
  "command": "agy",
  "delivery": "arg",
  "skillArgs": ["-i", "Leia o arquivo {promptFile} e siga as instruções que estão nele."]
}
```

`{promptFile}` é montado pelo app com **skill + tarefa + protocolo de orquestração**,
nessa ordem. Some a espera cega e some o inferno de aspas de passar markdown
multilinha como argumento.

> `{promptFile}` é o único placeholder que carrega o protocolo. `{skillFile}` e
> `{skillName}` entregam a skill crua e deixam o nó **fora** do pipeline — existem
> para CLIs que só sabem receber um arquivo de contexto.

O `paste` continua valendo como padrão para qualquer CLI interativa sem flag de
prompt inicial.

### Agentes que criam agentes

O agente pode pedir um agente novo, gravando um JSON na pasta de
`ORCHESTRATOR_EVENTS_DIR` (a mesma dos documentos):

```json
{ "spawn": "Revisor", "from": "<ORCHESTRATOR_TERMINAL_ID>", "task": "Revise src/api.ts" }
```

Campos opcionais: `agent` (id do `agents.json`; sem ele, herda a CLI de quem pediu) e
`skill`. O nó nasce ao lado de quem pediu, **ligado a ele**, e a tarefa viaja junto do
primeiro prompt — não existe "esperar a CLI subir para então mandar o trabalho".

O terminal agora conhece o próprio id em `ORCHESTRATOR_TERMINAL_ID`, que é o que
permite ao agente pedir um filho ligado a si mesmo.

**Freio:** no máximo 8 agentes criados por agentes por sessão. Um agente que se
divide sem parar enche o canvas e esvazia a cota antes de alguém perceber. O limite
é só para spawn automático; criar nós à mão continua livre. O botão **Retomar** da
barra superior zera o contador, junto com os saltos do pipeline.

### Confirmações de permissão travam o pipeline

Uma CLI que pede confirmação a cada escrita de arquivo **para o pipeline automático**,
que não tem humano no meio para clicar. Cada CLI tem a sua saída: no `agy` é
`--dangerously-skip-permissions`, no `claude` é `--permission-mode`. Use apenas numa
pasta de exercício, nunca num repositório de verdade — é literalmente dar ao agente
escrita sem pergunta. Para ligar, acrescente a flag em `args` no `agents.json`:

```json
{ "id": "antigravity-aula", "command": "agy", "args": ["--dangerously-skip-permissions"] }
```

---

## 🪝 Integração com o Claude Code: veredito que não depende de obediência

O protocolo pede ao agente que grave o arquivo de status ao terminar. Funciona —
mas depende de obediência. Quando o agente esquece, **nada roteia e o nó seguinte
espera para sempre, sem erro na tela**. É a pior falha desse desenho, porque é
silenciosa.

O Claude Code tem um hook `Stop`, que dispara quando ele termina de responder.
Apontado para `hooks/claude-stop.cjs`, o veredito deixa de ser um pedido e passa a
ser mecânico:

```json
{
  "id": "claude",
  "command": "claude",
  "delivery": "arg",
  "skillArgs": ["--settings", "{claudeSettings}", "Leia e siga as instrucoes do arquivo {promptFile}"]
}
```

`{claudeSettings}` é um `settings.json` **por sessão**, gerado pelo app. Vai por
sessão de propósito: o app não tem o direito de alterar o `~/.claude/settings.json`
de quem o instalou.

O hook segue duas regras:

- **Não encosta num veredito explícito.** Se o agente gravou o arquivo, ele vence.
- **Se não gravou**, escreve `approved` com `auto: true`, e o orquestrador avisa na
  tela: *"APROVADO (automático: o agente encerrou sem gravar o status)"*. Ninguém
  confunde um aprovado automático com uma aprovação de verdade.

Ele **não** tenta adivinhar reprovação lendo a resposta do agente. Procurar
"reprovado" em prosa erra em frases como "não vou reprovar", e um falso aprovado é
pior que um veredito ausente. Para reprovar, o agente grava o arquivo — é o que o
protocolo pede.

O hook recebe o caminho do status pelo ambiente (`ORCHESTRATOR_STATUS_FILE`, que ele
herda do PTY) e lê `last_assistant_message` do stdin do evento. Node é garantido ali:
o Claude Code é distribuído por npm, então onde ele roda, o `node` existe.

### Por que os argumentos não têm acento

O texto em `skillArgs` atravessa a linha de comando do shell, e no PowerShell 5.1
acento em argumento corrompe com facilidade — o agente receberia a instrução
ilegível. Todo o conteúdo com acento vai dentro do `{promptFile}`, que é lido como
UTF-8. Mantenha `skillArgs` em ASCII.

### Uma instância por vez

O app agora recusa uma segunda instância e traz a primeira para a frente. Não é
polimento: duas instâncias compartilham a mesma pasta de `userData` e, portanto, a
mesma pasta de eventos e de status. Os dois observadores fazem polling do mesmo
lugar e **consomem o arquivo do outro** — o veredito de um agente roteia no canvas
errado, ou se perde. Um duplo clique no atalho bastava para cair nisso.

### O que o orquestrador não consegue resolver: o primeiro uso da CLI

Toda CLI de agente abre, na primeira vez numa pasta, algum pedido que só uma pessoa
responde: "confia nos arquivos desta pasta?", escolha de tema, login. Enquanto isso
está na tela, o agente **não lê o prompt inicial e não termina turno nenhum** —
logo, nenhum hook dispara e nada roteia.

Observado aqui: o Claude Code iniciado pelo orquestrador numa pasta nova ficou
parado nesse estado indefinidamente.

Não há solução dentro do app: responder por conta própria seria aceitar, em nome do
usuário, que um agente mexa naqueles arquivos. **A cada máquina, rode uma vez na mão
cada CLI que a turma vai usar, na pasta de trabalho**, e deixe o primeiro uso
resolvido antes da aula. É o que `minicurso/preparar-maquina.ps1` instrui no fim.

### Ver o que a IA está fazendo: o rastro de ações

O terminal já mostra o trabalho do agente — mas em prosa, no meio da resposta e
rolando para fora da tela. Numa sala de aula isso não serve: o aluno precisa bater
o olho no nó e entender em dois segundos o que aquela IA está fazendo.

O hook `PostToolUse` resolve isso. Cada ferramenta que o agente usa vira uma linha
numa faixa entre o cabeçalho e o terminal:

```
▸ leu cobranca.js                                        7 ações
```

Clicando, a faixa abre e mostra as últimas 8 ações, da mais recente para a mais
antiga, com um ícone por tipo — ler, escrever, rodar comando, buscar. O verbo vem
em português, porque `Read` não diz nada para quem está aprendendo.

Com dois ou três nós no canvas, dá para ver ao mesmo tempo quem está lendo, quem
está escrevendo e quem está rodando teste. É isso que torna a orquestração
observável em vez de mágica.

O rastro é gravado por `hooks/claude-trace.cjs` como uma linha JSON por ação, em
`ORCHESTRATOR_TRACE_FILE`. O app lê só o que chegou desde a última leitura, por
posição de byte: um agente que roda uma hora gera um arquivo grande, e reprocessá-lo
duas vezes por segundo seria desperdício. Linha incompleta fica para o ciclo
seguinte, pelo mesmo motivo do arquivo de status.

**Limite honesto:** depende de hooks, então hoje só funciona com o **Claude Code**.
Com o Antigravity a faixa fica vazia — é falta de recurso na CLI, não bug do app.

### Fluxos de teste

`minicurso/fluxos-de-teste.md` traz nove fluxos, do terminal puro ao pipeline de
dois agentes, cada um isolando uma peça, com o que esperar e o que anotar quando
falhar. Os fluxos 5 a 7 servem também como exercício da turma.

---

## 📄 Nós de documento e grupos

### Documentos (.md) no canvas

Documentos markdown viram nós ao lado dos terminais, e podem ser ligados a um
terminal para virar contexto do agente.

Há três formas de um documento aparecer:

| Origem | Como acontece |
|---|---|
| `criado por você` | botão **Documento** na barra superior; cria o `.md` em disco |
| `anunciado pelo agente` | o agente grava um JSON na pasta de eventos dizendo qual arquivo abriu e por quê |
| (atualização) | o observador de disco detecta qualquer alteração num `.md` e atualiza o nó correspondente |

Os dois mecanismos têm papéis diferentes de propósito. O **anúncio cria** o nó,
porque só o agente sabe que aquele arquivo é relevante e por quê. O **observador
de disco atualiza** o conteúdo, mas não cria nós sozinho — um projeto com dezenas
de `.md` encheria o canvas de ruído a cada salvamento.

Para anunciar, o agente grava em `ORCHESTRATOR_EVENTS_DIR` (variável já definida no
terminal) um JSON de nome único:

```json
{ "document": "docs/regras.md", "intent": "validar a regra de nomenclatura" }
```

**Ligar um documento a um terminal** injeta o conteúdo do arquivo como contexto
no agente daquele terminal, do mesmo jeito que uma skill.

A pasta observada é a raiz do projeto, ou o que estiver em
`AGENT_ORCHESTRATOR_WATCH_DIR`.

### Grupos

O botão **Agrupar** cria uma moldura em volta dos nós selecionados (ou de todos,
se nada estiver selecionado), com um título editável pairando acima dela. Os nós
viram filhos de verdade do grupo, então arrastar a moldura leva todo o conjunto
junto. Remover o grupo mantém os nós, devolvendo cada um à sua posição absoluta.
