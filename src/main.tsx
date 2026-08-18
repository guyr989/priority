import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { soundProvider } from './api'
import { isHistory } from './domain/history'
import { isTrack } from './domain/track'
import { isViewMode } from './domain/view'
import { createLocalStore } from './storage/localStore'

const historyStore = createLocalStore('priority.recent-searches', isHistory)
const viewStore = createLocalStore('priority.view', isViewMode)
const lastTrackStore = createLocalStore('priority.last-track', isTrack)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      provider={soundProvider}
      historyStore={historyStore}
      viewStore={viewStore}
      lastTrackStore={lastTrackStore}
    />
  </StrictMode>,
)
