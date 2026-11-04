import { OrchestratorAPI } from '../shared/types'

declare global {
  interface Window {
    orchestrator: OrchestratorAPI
    iflow: OrchestratorAPI
  }
}

export {}
