import { useEffect, useState } from 'react'
import { soundProvider } from './api/mixcloud'
import { ImageContainer } from './components/ImageContainer'
import { RecentSearches } from './components/RecentSearches'
import { SearchContainer, type ViewMode } from './components/SearchContainer'
import { useSearch } from './hooks/useSearch'
import { useSearchHistory } from './hooks/useSearchHistory'
import { isHistory } from './domain/history'
import { createLocalStore } from './storage/localStore'
import type { Track } from './domain/track'
import styles from './App.module.css'

const historyStore = createLocalStore('priority.recent-searches', isHistory)

function App() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<Track | null>(null)

  const { tracks, hasNext, hasPrev, goToNextPage, goToPrevPage, refresh } = useSearch(
    soundProvider,
    query,
    300,
  )
  const { terms, record } = useSearchHistory(historyStore)

  useEffect(() => {
    if (tracks.length > 0) record(query)
  }, [tracks, query, record])

  return (
    <main className={styles.layout}>
      <SearchContainer
        query={query}
        view={view}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onQueryChange={setQuery}
        onSubmit={refresh}
        onViewChange={setView}
        onPrev={goToPrevPage}
        onNext={goToNextPage}
      >
        <ul className={styles.results}>
          {tracks.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                className={styles.result}
                onClick={() => setSelected(track)}
              >
                {track.title}
              </button>
            </li>
          ))}
        </ul>
      </SearchContainer>

      <div className={styles.side}>
        <ImageContainer track={selected} onImageClick={() => { }} />
        <RecentSearches terms={terms} onSelect={setQuery} />
      </div>
    </main>
  )
}

export default App
