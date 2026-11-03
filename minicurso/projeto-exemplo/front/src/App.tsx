import { useEffect, useState } from 'react'
import { buscarCobrancas } from './api'
import { ListaCobrancas } from './components/ListaCobrancas'
import { NovaCobranca } from './components/NovaCobranca'
import type { Cobranca } from './tipos'

export function App() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])

  useEffect(() => {
    buscarCobrancas().then(setCobrancas)
  }, [])

  function aoCriar(nova: Cobranca) {
    setCobrancas([...cobrancas, nova])
  }

  return (
    <main className="pagina">
      <header>
        <h1>Cobranças</h1>
        <p className="subtitulo">{cobrancas.length} no total</p>
      </header>

      <NovaCobranca aoCriar={aoCriar} />
      <ListaCobrancas cobrancas={cobrancas} />
    </main>
  )
}
