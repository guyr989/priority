import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { attachPlayback, soundProvider } from './api'
import { isLayoutId, isPaletteId } from './domain/appearance'
import { isPlayerVisible } from './domain/playback'
import { isHistory } from './domain/history'
import { isTrack } from './domain/track'
import { isViewMode } from './domain/view'
import { applyPalette } from './hooks/useAppearance'
import { createLocalStore } from './storage/localStore'

const historyStore = createLocalStore('priority.recent-searches', isHistory)
const viewStore = createLocalStore('priority.view', isViewMode)
const lastTrackStore = createLocalStore('priority.last-track', isTrack)
const paletteStore = createLocalStore('priority.palette', isPaletteId)
const layoutStore = createLocalStore('priority.layout', isLayoutId)
const playerStore = createLocalStore('priority.player-visible', isPlayerVisible)

applyPalette(paletteStore.read())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      provider={soundProvider}
      historyStore={historyStore}
      viewStore={viewStore}
      lastTrackStore={lastTrackStore}
      paletteStore={paletteStore}
      layoutStore={layoutStore}
      playerStore={playerStore}
      attachPlayback={attachPlayback}
    />
  </StrictMode>,
)
