import { useEffect, useState } from 'react'
import { ImageContainer } from './components/ImageContainer'
import { RecentSearches } from './components/RecentSearches'
import { SearchContainer, type ViewMode } from './components/SearchContainer'
import { useSearch } from './hooks/useSearch'
import { useSearchHistory } from './hooks/useSearchHistory'
import type { SoundProvider } from './domain/soundProvider'
import type { Store } from './storage/store'
import type { Track } from './domain/track'
import styles from './App.module.css'

const DEBOUNCE_MS = 300

interface AppProps {
  readonly provider: SoundProvider
  readonly historyStore: Store<readonly string[]>
}

function App({ provider, historyStore }: AppProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<Track | null>(null)

  const { tracks, hasNext, hasPrev, goToNextPage, goToPrevPage, restart } = useSearch(
    provider,
    query,
    DEBOUNCE_MS,
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
        onSubmit={restart}
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
        <RecentSearches
          terms={terms}
          onSelect={(term) => {
            setQuery(term)
            if (term === query) restart()
          }}
        />
      </div>
    </main>
  )
}

export default App
