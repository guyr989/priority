import { useState } from 'react'
import { soundProvider } from './api/mixcloud'
import { ImageContainer } from './components/ImageContainer'
import { RecentSearches } from './components/RecentSearches'
import { SearchContainer, type ViewMode } from './components/SearchContainer'
import { useSearch } from './hooks/useSearch'
import type { Track } from './domain/track'
import styles from './App.module.css'

// Placeholder history. Slice 12 replaces it with domain/history.ts.
const PLACEHOLDER_TERMS: readonly string[] = ['adele', 'boiler room', 'jazz']

function App() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<Track | null>(null)

  const tracks = useSearch(soundProvider, query)

  return (
    <main className={styles.layout}>
      <SearchContainer
        query={query}
        view={view}
        hasPrev={false}
        hasNext={false}
        onQueryChange={setQuery}
        onSubmit={() => {}}
        onViewChange={setView}
        onPrev={() => {}}
        onNext={() => {}}
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
        <ImageContainer track={selected} onImageClick={() => {}} />
        <RecentSearches terms={PLACEHOLDER_TERMS} onSelect={setQuery} />
      </div>
    </main>
  )
}

export default App
