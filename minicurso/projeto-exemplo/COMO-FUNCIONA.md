# Projeto de exemplo — Cobranças

Um sistema pequeno e **de propósito imperfeito**: cada defeito aqui dentro é uma
tarefa que o aluno vai resolver com um agente de IA dentro do orquestrador.

> Este é um projeto montado para a aula, no mesmo formato de um front React + TS
> com um backend separado. Quando o projeto real entrar no lugar dele, as tarefas
> continuam valendo: elas falam de padrões (estado de carregamento, tratamento de
> erro, validação de entrada), não deste código específico.

---

## Como rodar

### Backend — sem instalar nada

```bash
cd back
node server.js
```

Sobe em `http://localhost:3001`. **Zero dependências**: só o módulo `http` do
Node. Isso é deliberado — numa sala de 30 máquinas, cada `npm install` é uma
chance a mais de a aula travar.

Os testes usam o runner embutido do Node:

```bash
cd back
node --test
```

### Frontend — precisa de `npm install`

```bash
cd front
npm install
npm run dev
```

Abre em `http://localhost:5174`. Com o backend no ar, a tabela carrega.

**Para a maioria das tarefas o aluno não precisa rodar o front.** O agente lê e
edita o código, e o resultado se confere lendo o diff. Rodar é bom para ver o
efeito, não é obrigatório.

---

## Mapa dos arquivos

### `back/` — a API

| Arquivo | O que é |
|---|---|
| `cobrancas.js` | As regras de negócio: listar, buscar, criar, calcular parcela, juros, total em aberto. **É aqui que moram quase todos os defeitos.** |
| `server.js` | As rotas HTTP. `GET /cobrancas`, `GET /cobrancas/:id`, `POST /cobrancas`, `GET /resumo`. |
| `cobrancas.test.js` | Três testes, que passam. A cobertura é proposital­mente incompleta. |

O "banco de dados" é um array em memória. Reiniciar o servidor devolve tudo ao
estado inicial — o que é ótimo para a aula: cada aluno recomeça limpo.

### `front/` — a tela

| Arquivo | O que é |
|---|---|
| `src/App.tsx` | A página. Busca as cobranças e monta o cabeçalho, o formulário e a tabela. |
| `src/api.ts` | As duas chamadas à API. |
| `src/tipos.ts` | O tipo `Cobranca`, compartilhado. |
| `src/components/ListaCobrancas.tsx` | A tabela. |
| `src/components/NovaCobranca.tsx` | O formulário de criação. |

---

## Onde estão os problemas

Esta lista existe para **você**, instrutor. O aluno recebe uma tarefa por vez e
descobre o resto investigando — que é o ponto do exercício.

### No frontend

1. **Não existe estado de carregamento.** `App.tsx` começa com uma lista vazia e
   só preenche quando o `fetch` responde. Entre uma coisa e outra, a tela diz
   "0 no total" e mostra uma tabela vazia, como se não houvesse cobrança nenhuma.
2. **Erro de rede é engolido.** `buscarCobrancas()` não trata falha. Com o
   backend desligado, a promessa rejeita, ninguém escuta, e a tela fica
   permanentemente vazia sem dizer por quê.
3. **A lista usa o índice como `key`.** Funciona até alguém remover ou reordenar
   um item.
4. **Dinheiro aparece cru.** `1200` em vez de `R$ 1.200,00`, e a parcela de 890,5
   em 3 vezes vira `296.8333333333333`.
5. **Não há estado de lista vazia.** Sem nenhuma cobrança, o usuário vê só o
   cabeçalho da tabela.
6. **O formulário não valida nada.** Dá para enviar com tudo em branco.

### No backend

1. **Divisão por zero.** `calcularParcela(1200, 0)` devolve `Infinity`, e nada
   impede isso.
2. **`GET /cobrancas/:id` inexistente responde 200.** Com o corpo vazio, em vez
   de 404. O front não tem como distinguir "não existe" de "deu errado".
3. **`POST /cobrancas` não valida.** Enviar `{}` cria uma cobrança com cliente,
   total e parcelas `undefined`, e responde 200 em vez de 201.
4. **`aplicarJuros` não tem teste nenhum.** É a função com a matemática mais
   fácil de errar.

---

## Como isto se conecta ao orquestrador

1. O projeto fica em `C:\minicurso\workspace` — a pasta onde os terminais do
   orquestrador nascem e que o observador de documentos vigia.
2. Cada tarefa é uma **skill**: um `.md` em `skills/`, ao lado do exe. O aluno
   escolhe no seletor **Skill** ao criar o terminal, e o agente recebe aquele
   texto como primeiro prompt.
3. Com **Claude Code**, cada ação do agente aparece na faixa do nó — `leu
   cobrancas.js`, `rodou node --test` — e ao fim do turno o veredito do pipeline
   é gravado sozinho pelo hook.
4. Ligando dois nós, o trabalho de um vai para o outro: é assim que se monta
   **codifica → revisa**, com a aresta `reprovado` voltando ao autor.

As tarefas prontas estão em `minicurso/tarefas.md`, e as skills
correspondentes em `skills/tarefa-*.md`.
