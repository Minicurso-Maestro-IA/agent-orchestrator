import type { ReactElement } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { SpatialCanvas } from './components/SpatialCanvas'

export function App(): ReactElement {
  return (
    <ReactFlowProvider>
      <SpatialCanvas />
    </ReactFlowProvider>
  )
}

export default App
