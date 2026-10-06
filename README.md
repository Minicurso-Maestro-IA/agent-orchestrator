# Agent Orchestrator 🛸

Workspace desktop com **Canvas Espacial 2D infinito** capaz de orquestrar múltiplos terminais nativos e agentes de IA em nós conectáveis e arrastáveis.

---

## 🛠️ Stack Tecnológica (Fase 1 MVP)

- **Electron 34+** com `electron-vite` (Main, Preload e Renderer unificados com TypeScript)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **@xyflow/react** (React Flow v12) para o canvas espacial 2D infinito
- **@xterm/xterm** + **@xterm/addon-fit** + **@xterm/addon-webgl** para renderização acelerada de terminais
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
│   │   │   └── pty-manager.ts      # Gerenciador de processos PTY nativos (PowerShell, CMD, WSL)
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
- **Aceleração WebGL**: Renderização de terminal de alta performance com fallback gracioso.
