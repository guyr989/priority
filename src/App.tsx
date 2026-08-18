import { useCallback, useEffect, useRef, useState } from 'react'
import { AppearanceMenu } from './components/AppearanceMenu'
import { FlyingResult } from './components/FlyingResult'
import { ImageContainer } from './components/ImageContainer'
import { RecentSearches } from './components/RecentSearches'
import { Results } from './components/Results'
import { SearchContainer } from './components/SearchContainer'
import { useAppearance } from './hooks/useAppearance'
import { usePlayback } from './hooks/usePlayback'
import { useSearch } from './hooks/useSearch'
import { useSearchHistory } from './hooks/useSearchHistory'
import { APPEARANCES } from './domain/appearance'
import type { LayoutName } from './domain/appearance'
import type { AttachPlayback } from './hooks/usePlayback'
import type { SoundProvider } from './domain/soundProvider'
import type { ViewMode } from './domain/view'
import type { Store } from './storage/store'
import type { Track } from './domain/track'
import styles from './App.module.css'

const DEBOUNCE_MS = 300

const LAYOUT_CLASS = {
  side: styles.side,
  stack: styles.stack,
  banner: styles.banner,
} satisfies Record<LayoutName, string | undefined>

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
  readonly lastTrackStore: Store<Track>
  readonly appearanceStore: Store<string>
  readonly attachPlayback: AttachPlayback
  readonly debounceMs?: number
}

function App({
  provider,
  historyStore,
  viewStore,
  lastTrackStore,
  appearanceStore,
  attachPlayback,
  debounceMs = DEBOUNCE_MS,
}: AppProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>(() => viewStore.read() ?? 'list')
  const [selected, setSelected] = useState<Track | null>(() => lastTrackStore.read())
  const [flight, setFlight] = useState<Flight | null>(null)
  const [embedded, setEmbedded] = useState(false)
  const chosenHere = useRef(false)
  const imageSlotRef = useRef<HTMLDivElement>(null)
  const imageSectionRef = useRef<HTMLElement>(null)
  const playerRef = useRef<HTMLIFrameElement>(null)

  const { look, choose } = useAppearance(appearanceStore)
  const playing = embedded && look.showsPlayer
  const isPlaying = usePlayback(playerRef, attachPlayback, playing, selected?.id ?? null)

  const { tracks, status, hasNext, hasPrev, goToNextPage, goToPrevPage, restart, retry } =
    useSearch(provider, query, debounceMs)
  const { terms, record } = useSearchHistory(historyStore)

  useEffect(() => {
    if (tracks.length > 0) record(query)
  }, [tracks, query, record])

  // A restored cover must not steal focus on load, only one the user just picked.
  useEffect(() => {
    if (selected === null || !chosenHere.current) return
    imageSectionRef.current?.focus({ preventScroll: true })
    imageSectionRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const showTrack = useCallback((track: Track) => {
    setSelected(track)
  }, [])

  const landFlight = useCallback(() => {
    setFlight((current) => {
      if (current !== null) showTrack(current.track)
      return null
    })
  }, [showTrack])

  const selectTrack = (track: Track, origin: HTMLElement) => {
    chosenHere.current = true
    setEmbedded(false)
    lastTrackStore.write(track)
    imageSectionRef.current?.scrollIntoView({ block: 'nearest' })
    if (prefersReducedMotion()) {
      showTrack(track)
      return
    }
    setFlight({ track, from: origin.getBoundingClientRect() })
  }

  const showNowPlaying = selected !== null || flight !== null

  return (
    <>
      <header className={styles.band}>
        <div className={styles.bar}>
          <h1 className={styles.wordmark}>Sound search</h1>
          <AppearanceMenu looks={APPEARANCES} current={look} onChoose={choose} />
        </div>
      </header>

      <main
        className={[
          styles.layout,
          showNowPlaying ? LAYOUT_CLASS[look.layout] : styles.solo,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {showNowPlaying && (
          <div className={styles.now}>
            <ImageContainer
              track={selected}
              sectionRef={imageSectionRef}
              slotRef={imageSlotRef}
              frameRef={playerRef}
              playable={look.showsPlayer}
              embedded={playing}
              isPlaying={isPlaying}
              onImageClick={() => setEmbedded(true)}
            />
          </div>
        )}

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
          recent={
            <RecentSearches
              terms={terms}
              onSelect={(term) => {
                setQuery(term)
                if (term === query) restart()
              }}
            />
          }
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

        {flight !== null && (
          <FlyingResult
            label={flight.track.title}
            from={flight.from}
            targetRef={imageSlotRef}
            onFinish={landFlight}
          />
        )}
      </main>
    </>
  )
}

export default App
