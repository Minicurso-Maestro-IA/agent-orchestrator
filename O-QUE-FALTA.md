# iFlow + virta — o que falta

Checklist do minicurso. O caminho do repositório é `C:\minicurso\repo`.

Para abrir o app, de qualquer janela do PowerShell:

```powershell
cd C:\minicurso\repo
.\iniciar.ps1
```

Para a bateria 2, mudando só a pasta de trabalho:

```powershell
.\iniciar.ps1 -Pasta C:\minicurso\workspace\virta-front-end
```

---

## 1. Urgente, e não tem a ver com a aula

- [ ] **Rotacionar as credenciais** que passaram pelo chat dentro do zip do
      virta: `spring.datasource.password`, `api.security.token.secret` e
      `brevo.api-key`. Trocar o segredo do JWT desloga todo mundo — faça num
      horário que não atrapalhe.

Está em aberto desde o primeiro dia. É o único item aqui que não pode esperar a
aula.

---

## 2. Antes da aula

### Validar o pipeline

- [ ] **Bateria 1** — o algoritmo de desconto. Roteiro completo em
      `minicurso/BATERIAS-DE-TESTE.md`.
- [ ] **Bateria 2** — uma tarefa do virta (sugestão: a issue 1).
- [ ] **Medir a cota**: `/usage` no `agy` antes e depois.
      `node minicurso\medir-agy.mjs` mede quantas vezes em 5 o agente obedece ao
      protocolo sem ser lembrado.

Os três números que decidem tudo: quantos saltos até aprovar, se o nó 3
reprovou alguma vez, e quanto de cota foi embora. **Se o nó 3 aprovar de
primeira nas duas baterias, o pipeline não está revisando nada.**

### GitHub

- [ ] **Proteger a `main`** do `virta-minicurso`: exigir pull request, 1
      aprovação e o check `build`. Adicione você mesmo em *Bypass*.
- [ ] **Adicionar os alunos** como colaboradores com permissão *Write*.
- [ ] **Puxar as 8 issues para o kanban** e ligar o *Auto-add*.

### Laboratório

- [ ] **Gerar o zip** na sua máquina (tem que ser no Windows, senão o ícone não
      entra no `.exe`):

      ```powershell
      cd C:\minicurso\repo
      npm run dist:win
      node minicurso\montar-zip-aula.mjs
      ```

- [ ] **Mandar para o professor** o `dist\iflow-virta-minicurso.zip`.
- [ ] Em cada máquina: `agy` instalado e **aberto uma vez na mão** para o login.

---

## 3. Decisões que ainda são suas

- [ ] **Mergear a `integracao`?** Ela parte da `main` do Eliandro e leva o
      material da aula. Vale ele revisar antes — principalmente `package.json` e
      `pty-manager.ts`, onde a junção foi mais delicada.
- [ ] **Quebrar o commit grande** em uma sequência revisável? Hoje é um commit
      de ~7.600 linhas.
- [ ] **zip ou portable?** O portable é um auto-extrator que roda a partir do
      `%TEMP%` — o padrão que mais dispara antivírus. Os dois são gerados; é só
      escolher qual você distribui.
- [ ] **Certificado de assinatura?** É a única coisa que remove o aviso do
      Windows de verdade. Vale perguntar se o IFPR já tem um antes de desistir.

---

## 4. Armadilhas conhecidas

**O assistente de primeiro uso do `agy`.** Enquanto ele estiver na tela, o
agente não lê o prompt inicial e o orquestrador não roteia nada. Parece defeito
do app e não é. Abra o `agy` uma vez na mão em cada máquina.

**O ícone só entra no `.exe` se o build for no Windows.** Gravar ícone e
metadados depende do `rcedit`, que é binário Windows. Empacotando em Linux sai o
ícone genérico do Electron.

**Desbloqueie o zip antes de extrair.** O Windows carimba tudo que vem da
internet e o `Expand-Archive` repassa o carimbo para cada arquivo — é o que faz
o aviso reaparecer toda vez. Botão direito no zip → Propriedades → Desbloquear.

**O rótulo da aresta é um botão.** Aquele `sempre` minúsculo no meio da linha
cicla para `aprovado` e `reprovado` quando clicado. Ninguém descobre sozinho —
precisa estar no slide.

**Nada é salvo no canvas.** Fechou o app, perdeu os nós e as arestas.

**Entrar no virta:** `maria@virta.com` / `123456`. O cadastro fica em
`/cadastro` (não `/register`) e exige **senha forte** — `123456` é recusado ali.
Se der "inválidos" com a senha certa, é cache: `Ctrl+Shift+R`, e se persistir
apague `virta-aula-banco-v1` e `virta.session` no DevTools.

---

## 5. Links

| O quê | Onde |
|---|---|
| App do aluno | https://minicurso-maestro-ia.github.io/virta-minicurso/ |
| As 8 tarefas | https://github.com/Minicurso-Maestro-IA/virta-minicurso/issues |
| Plano da aula | `minicurso/PLANO-DA-AULA.md` |
| Montar o pipeline | `minicurso/PIPELINE-3-AGENTES.md` |
| As duas baterias | `minicurso/BATERIAS-DE-TESTE.md` |
| Como escrever tarefa | `minicurso/COMO-ESCREVER-UMA-TAREFA.md` |
