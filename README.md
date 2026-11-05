# iFlow 🛸

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
iflow/
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
