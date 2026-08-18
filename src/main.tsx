import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { soundProvider } from './api/mixcloud'
import { isHistory } from './domain/history'
import { createLocalStore } from './storage/localStore'

const historyStore = createLocalStore('priority.recent-searches', isHistory)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App provider={soundProvider} historyStore={historyStore} />
  </StrictMode>,
)
