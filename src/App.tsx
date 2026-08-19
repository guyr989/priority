import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AppearanceMenu } from './components/AppearanceMenu'
import { FlyingResult } from './components/FlyingResult'
import { ImageContainer } from './components/ImageContainer'
import { PlayerToggle } from './components/PlayerToggle'
import { RecentSearches } from './components/RecentSearches'
import { Results } from './components/Results'
import { SearchContainer } from './components/SearchContainer'
import { useAppearance } from './hooks/useAppearance'
import { usePlayback } from './hooks/usePlayback'
import { useSearch } from './hooks/useSearch'
import { useSearchHistory } from './hooks/useSearchHistory'
import { APPEARANCES } from './domain/appearance'
import type { Appearance, AppearanceId, LayoutName } from './domain/appearance'
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
  row: styles.row,
} satisfies Record<LayoutName, string | undefined>

/**
 * The looks that paint the cover behind the page read it from one custom
 * property. Quoting a remote URL into CSS is the one place a stray character
 * could close the url() early, so the value is encoded before it goes in.
 */
function backdropStyle(look: Appearance, track: Track | null): CSSProperties {
  if (!look.coverBackdrop || track === null) return {}

  const safe = encodeURI(track.imageUrl).replace(/"/g, '%22')
  return { '--sleeve': `url("${safe}")` } as CSSProperties
}

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
  readonly appearanceStore: Store<AppearanceId>
  readonly playerStore: Store<boolean>
  readonly attachPlayback: AttachPlayback
  readonly debounceMs?: number
}

function App({
  provider,
  historyStore,
  viewStore,
  lastTrackStore,
  appearanceStore,
  playerStore,
  attachPlayback,
  debounceMs = DEBOUNCE_MS,
}: AppProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>(() => viewStore.read() ?? 'list')
  const [selected, setSelected] = useState<Track | null>(() => lastTrackStore.read())
  const [flight, setFlight] = useState<Flight | null>(null)
  const [embedded, setEmbedded] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(true)
  const chosenHere = useRef(false)
  const imageSlotRef = useRef<HTMLDivElement>(null)
  const imageSectionRef = useRef<HTMLElement>(null)
  const playerRef = useRef<HTMLIFrameElement>(null)

  const [playerOn, setPlayerOn] = useState(() => playerStore.read() ?? false)
  const { look, choose } = useAppearance(appearanceStore)
  const isPlaying = usePlayback(playerRef, attachPlayback, embedded, selected?.id ?? null)

  // Turning the player off stops it. Turning it back on must not restart the
  // set from zero, so the sleeve offers its play control again instead.
  const togglePlayer = (on: boolean) => {
    setPlayerOn(on)
    playerStore.write(on)
    if (!on) setEmbedded(false)
  }

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

  // Picking a track folds the list away, so the cover it lands on is the next
  // thing under the search rather than the far side of six results. Anything
  // that changes the list unfolds it again.
  const selectTrack = (track: Track, origin: HTMLElement) => {
    chosenHere.current = true
    setResultsOpen(false)
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
          <div className={styles.controls}>
            <PlayerToggle on={playerOn} onChange={togglePlayer} />
            <AppearanceMenu looks={APPEARANCES} current={look} onChoose={choose} />
          </div>
        </div>
      </header>

      <main
        className={[
          styles.layout,
          showNowPlaying ? LAYOUT_CLASS[look.layout] : styles.solo,
        ]
          .filter(Boolean)
          .join(' ')}
        style={backdropStyle(look, selected)}
      >
        <SearchContainer
          query={query}
          view={view}
          hasPrev={hasPrev}
          hasNext={hasNext}
          collapsible={tracks.length > 0}
          resultsOpen={resultsOpen}
          onResultsOpenChange={setResultsOpen}
          onQueryChange={(next) => {
            setResultsOpen(true)
            setQuery(next)
          }}
          onSubmit={() => {
            setResultsOpen(true)
            restart()
          }}
          onViewChange={(next) => {
            setView(next)
            viewStore.write(next)
          }}
          onPrev={() => {
            setResultsOpen(true)
            goToPrevPage()
          }}
          onNext={() => {
            setResultsOpen(true)
            goToNextPage()
          }}
          recent={
            <RecentSearches
              terms={terms}
              onSelect={(term) => {
                setResultsOpen(true)
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
            onRetry={() => {
              setResultsOpen(true)
              retry()
            }}
          />
        </SearchContainer>

        {showNowPlaying && (
          <div className={styles.now}>
            <ImageContainer
              track={selected}
              sectionRef={imageSectionRef}
              slotRef={imageSlotRef}
              frameRef={playerRef}
              playable={playerOn}
              embedded={embedded}
              isPlaying={isPlaying}
              onImageClick={() => setEmbedded(true)}
            />
          </div>
        )}

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
