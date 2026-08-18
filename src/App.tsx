import { useCallback, useEffect, useRef, useState } from 'react'
import { FlyingResult } from './components/FlyingResult'
import { ImageContainer } from './components/ImageContainer'
import { RecentSearches } from './components/RecentSearches'
import { Results } from './components/Results'
import { SearchContainer } from './components/SearchContainer'
import { useSearch } from './hooks/useSearch'
import { useSearchHistory } from './hooks/useSearchHistory'
import type { SoundProvider } from './domain/soundProvider'
import type { ViewMode } from './domain/view'
import type { Store } from './storage/store'
import type { Track } from './domain/track'
import styles from './App.module.css'

const DEBOUNCE_MS = 300

interface Flight {
  readonly track: Track
  readonly from: DOMRect
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

interface AppProps {
  readonly provider: SoundProvider
  readonly historyStore: Store<readonly string[]>
  readonly viewStore: Store<ViewMode>
  readonly debounceMs?: number
}

function App({
  provider,
  historyStore,
  viewStore,
  debounceMs = DEBOUNCE_MS,
}: AppProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>(() => viewStore.read() ?? 'list')
  const [selected, setSelected] = useState<Track | null>(null)
  const [flight, setFlight] = useState<Flight | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const imageSlotRef = useRef<HTMLDivElement>(null)
  const imageSectionRef = useRef<HTMLElement>(null)

  const { tracks, status, hasNext, hasPrev, goToNextPage, goToPrevPage, restart, retry } =
    useSearch(provider, query, debounceMs)
  const { terms, record } = useSearchHistory(historyStore)

  useEffect(() => {
    if (tracks.length > 0) record(query)
  }, [tracks, query, record])

  useEffect(() => {
    if (selected === null) return
    imageSectionRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const showTrack = useCallback((track: Track) => {
    setSelected(track)
    imageSectionRef.current?.focus({ preventScroll: true })
  }, [])

  const landFlight = useCallback(() => {
    setFlight((current) => {
      if (current !== null) showTrack(current.track)
      return null
    })
  }, [showTrack])

  const selectTrack = (track: Track, origin: HTMLElement) => {
    setIsPlaying(false)
    imageSectionRef.current?.scrollIntoView({ block: 'nearest' })
    if (prefersReducedMotion()) {
      showTrack(track)
      return
    }
    setFlight({ track, from: origin.getBoundingClientRect() })
  }

  return (
    <main className={styles.layout}>
      <h1 className="visually-hidden">Sound search</h1>

      <SearchContainer
        query={query}
        view={view}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onQueryChange={setQuery}
        onSubmit={restart}
        onViewChange={(next) => {
          setView(next)
          viewStore.write(next)
        }}
        onPrev={goToPrevPage}
        onNext={goToNextPage}
      >
        <Results
          status={status}
          view={view}
          tracks={tracks}
          showingId={selected?.id ?? null}
          onSelect={selectTrack}
          onRetry={retry}
        />
      </SearchContainer>

      <div className={styles.side}>
        <ImageContainer
          track={selected}
          sectionRef={imageSectionRef}
          slotRef={imageSlotRef}
          isPlaying={isPlaying}
          onImageClick={() => setIsPlaying(true)}
        />
        <RecentSearches
          terms={terms}
          onSelect={(term) => {
            setQuery(term)
            if (term === query) restart()
          }}
        />
      </div>

      {flight !== null && (
        <FlyingResult
          label={flight.track.title}
          from={flight.from}
          targetRef={imageSlotRef}
          onFinish={landFlight}
        />
      )}
    </main>
  )
}

export default App
