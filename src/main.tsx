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
import { clearLocalStores, createLocalStore } from './storage/localStore'

/**
 * Every key this app writes, named once. Clearing reads the same list the
 * stores are built from, so the two cannot drift apart.
 */
const KEY = {
  history: 'priority.recent-searches',
  view: 'priority.view',
  lastTrack: 'priority.last-track',
  palette: 'priority.palette',
  layout: 'priority.layout',
  player: 'priority.player-visible',
} as const

const historyStore = createLocalStore(KEY.history, isHistory)
const viewStore = createLocalStore(KEY.view, isViewMode)
const lastTrackStore = createLocalStore(KEY.lastTrack, isTrack)
const paletteStore = createLocalStore(KEY.palette, isPaletteId)
const layoutStore = createLocalStore(KEY.layout, isLayoutId)
const playerStore = createLocalStore(KEY.player, isPlayerVisible)

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
      /* Reloading is the honest way to show a cleared device: it rebuilds
         every piece of state from the storage that is now empty, rather than
         asking six setters to agree on what empty looks like. */
      onClearStored={() => {
        clearLocalStores(Object.values(KEY))
        window.location.reload()
      }}
    />
  </StrictMode>,
)
