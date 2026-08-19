import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { attachPlayback, soundProvider } from './api'
import { isAppearanceId } from './domain/appearance'
import { isPlayerVisible } from './domain/playback'
import { isHistory } from './domain/history'
import { isTrack } from './domain/track'
import { isViewMode } from './domain/view'
import { applyAppearance } from './hooks/useAppearance'
import { createLocalStore } from './storage/localStore'

const historyStore = createLocalStore('priority.recent-searches', isHistory)
const viewStore = createLocalStore('priority.view', isViewMode)
const lastTrackStore = createLocalStore('priority.last-track', isTrack)
const appearanceStore = createLocalStore('priority.appearance', isAppearanceId)
const playerStore = createLocalStore('priority.player-visible', isPlayerVisible)

applyAppearance(appearanceStore.read())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      provider={soundProvider}
      historyStore={historyStore}
      viewStore={viewStore}
      lastTrackStore={lastTrackStore}
      appearanceStore={appearanceStore}
      playerStore={playerStore}
      attachPlayback={attachPlayback}
    />
  </StrictMode>,
)
