# Virta — app da aula

Versão do virta feita para o minicurso: **só frontend, dados no navegador**.
Sem Java, sem banco, sem credencial. O mesmo código roda no site publicado e na
máquina de quem clonar.

## Rodar

```bash
npm install
npm run dev
```

É isso. O "banco" é criado sozinho na primeira abertura — os dados ficam no
`localStorage` do navegador, semeados com oito transações. O botão **Recomeçar
dados** devolve tudo ao estado inicial, útil quando alguém bagunçar testando.

## O que tem de errado aqui

Oito defeitos plantados de propósito, **todos visuais e todos compilando**. O
`npm run build` passa: um aluno nunca fica travado sem conseguir rodar.

| O que se vê | Onde |
|---|---|
| Receita mostra `-` e despesa mostra `+` | `components/ListaTransacoes.tsx` |
| Todo valor em verde, inclusive despesa | `components/ListaTransacoes.tsx` |
| Data crua: `2026-01-15` | `components/ListaTransacoes.tsx` |
| Valor cru: `842.9` | `components/ListaTransacoes.tsx` |
| Descrição longa desalinha a linha | `components/ListaTransacoes.tsx` |
| Etiqueta de categoria cinza (mas a bolinha tem a cor certa) | `components/CategoriaBadge.tsx` |
| Gráfico com receita em vermelho (os cartões acima estão certos) | `components/Resumo.tsx` |
| Filtrar por Receitas continua mostrando tudo | `App.tsx` |

> `lib/formato.ts` tem `formatarMoeda` e `formatarData` prontas e funcionando.
> Duas das tarefas são sobre **usar o que já existe**, não escrever formatação
> nova — se o app ganhar uma segunda formatação, elas divergem com o tempo.

A lista acima é para o instrutor. O aluno recebe uma tarefa por vez.

## Publicar

O workflow `.github/workflows/deploy-virta-aula.yml` publica no GitHub Pages a
cada push. Para ligar: **Settings → Pages → Source: GitHub Actions**, uma vez.
