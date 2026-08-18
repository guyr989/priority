import { useState } from 'react'
import { ImageContainer } from './components/ImageContainer'
import { RecentSearches } from './components/RecentSearches'
import { SearchContainer, type ViewMode } from './components/SearchContainer'
import type { Track } from './domain/track'
import styles from './App.module.css'

// Placeholder data. Slice 4 replaces it with api/mixcloud.ts, slice 12 with real history.
const PLACEHOLDER_ART =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="%23d9d7d2"/></svg>'

const PLACEHOLDER_TRACKS: readonly Track[] = Array.from(
  { length: 6 },
  (_unused, index) => ({
    id: `placeholder-${index + 1}`,
    title: `Placeholder show ${index + 1}`,
    artist: 'Placeholder artist',
    imageUrl: PLACEHOLDER_ART,
    embedUrl: '',
  }),
)

const PLACEHOLDER_TERMS: readonly string[] = ['adele', 'boiler room', 'jazz']

function App() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<Track | null>(null)

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
          {PLACEHOLDER_TRACKS.map((track) => (
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
