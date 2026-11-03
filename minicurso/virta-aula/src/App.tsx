import { useCallback, useEffect, useState } from 'react'
import {
  criarTransacao,
  excluirTransacao,
  listarTransacoes,
  obterResumo,
  recomecar,
  type Resumo as DadosResumo
} from './mock/db'
import type { Transacao, TipoTransacao } from './tipos'
import { ListaTransacoes } from './components/ListaTransacoes'
import { NovaTransacao } from './components/NovaTransacao'
import { Resumo } from './components/Resumo'

type Filtro = 'TODAS' | TipoTransacao

export function App() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [resumo, setResumo] = useState<DadosResumo | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('TODAS')
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [lista, r] = await Promise.all([listarTransacoes(), obterResumo()])
      setTransacoes(lista)
      setResumo(r)
    } finally {
      setCarregando(false)
    }
  }, [filtro])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return (
    <main className="pagina">
      <header className="topo">
        <div>
          <h1>Virta</h1>
          <p className="subtitulo">Carteira pessoal — projeto do minicurso</p>
        </div>
        <button
          className="secundario"
          onClick={() => {
            recomecar()
            void carregar()
          }}
          title="Devolve os dados ao estado inicial"
        >
          Recomeçar dados
        </button>
      </header>

      {resumo && <Resumo dados={resumo} />}

      <section className="painel">
        <div className="painel-topo">
          <div className="abas">
            {(['TODAS', 'RECEITA', 'DESPESA'] as Filtro[]).map((f) => (
              <button
                key={f}
                className={`aba ${filtro === f ? 'aba-ativa' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f === 'TODAS' ? 'Todas' : f === 'RECEITA' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
          <NovaTransacao
            aoCriar={async (dados) => {
              await criarTransacao(dados)
              await carregar()
            }}
          />
        </div>

        {carregando ? (
          <p className="carregando">Carregando...</p>
        ) : (
          <ListaTransacoes
            transacoes={transacoes}
            aoExcluir={async (id) => {
              await excluirTransacao(id)
              await carregar()
            }}
          />
        )}
      </section>
    </main>
  )
}
