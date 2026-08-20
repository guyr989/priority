import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { PlayerBar } from './components/PlayerBar'
import { FlyingResult } from './components/FlyingResult'
import { ImageContainer } from './components/ImageContainer'
import { SettingsMenu } from './components/SettingsMenu'
import { RecentSearches } from './components/RecentSearches'
import { Results, announcement } from './components/Results'
import { SearchContainer } from './components/SearchContainer'
import { useAppearance } from './hooks/useAppearance'
import { useNarrow } from './hooks/useNarrow'
import { usePlayback } from './hooks/usePlayback'
import { useSearch } from './hooks/useSearch'
import { useSearchHistory } from './hooks/useSearchHistory'
import { LAYOUTS, PALETTES } from './domain/appearance'
import type { LayoutId, Palette, PaletteId } from './domain/appearance'
import type { AttachPlayback } from './hooks/usePlayback'
import type { SoundProvider } from './domain/soundProvider'
import type { ViewMode } from './domain/view'
import type { Store } from './storage/store'
import type { Track } from './domain/track'
import styles from './App.module.css'
import { strings } from './i18n/strings'

const DEBOUNCE_MS = 300

const LAYOUT_CLASS = {
  side: styles.side,
  stack: styles.stack,
  banner: styles.banner,
  row: styles.row,
} satisfies Record<LayoutId, string | undefined>

/**
 * These two give the sleeve and six results the same single column, and at one
 * viewport tall the arithmetic does not close: a standing cover leaves the
 * list about 26px. They take the phone's lying-down sleeve at every width.
 */
const LIE_DOWN_LAYOUTS: readonly LayoutId[] = ['stack', 'banner']

/**
 * The looks that paint the cover behind the page read it from one custom
 * property. Quoting a remote URL into CSS is the one place a stray character
 * could close the url() early, so the value is encoded before it goes in.
 */
function backdropStyle(palette: Palette, track: Track | null): CSSProperties {
  if (!palette.coverBackdrop || track === null) return {}

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
  readonly paletteStore: Store<PaletteId>
  readonly layoutStore: Store<LayoutId>
  readonly playerStore: Store<boolean>
  readonly attachPlayback: AttachPlayback
  readonly debounceMs?: number
}

function App({
  provider,
  historyStore,
  viewStore,
  lastTrackStore,
  paletteStore,
  layoutStore,
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
  const { palette, layout, choosePalette, chooseLayout } = useAppearance(
    paletteStore,
    layoutStore,
  )
  const narrow = useNarrow()
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
  const { terms, record, forget } = useSearchHistory(historyStore)

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

  // On one column, picking a track takes the results off the page: they have
  // done their job, and the cover it lands on is the next thing under the
  // search. A new search, a recent term, a page turn or a retry brings them
  // back. A window with room for both never loses them.
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

  // The board is on the page once there is something for it to say, and until
  // one column has already given the visitor what they came for. Everything
  // that follows is downstream: what the search may claim, and whether the
  // sleeve can stand up.
  //
  // `status !== 'idle'` and not `tracks.length > 0`: a search that is running,
  // that found nothing, or that failed all still owe the visitor a word, and
  // requirement 8 says none of them may be a blank page.
  const showResults = status !== 'idle' && (!narrow || tracks.length === 0 || resultsOpen)

  return (
    <>
      <header className={styles.band}>
        <div className={styles.bar}>
          <h1 className={styles.wordmark}>{strings.appName}</h1>
          <SettingsMenu
            palettes={PALETTES}
            palette={palette}
            layouts={narrow ? [] : LAYOUTS}
            layout={layout}
            playerOn={playerOn}
            onChoosePalette={choosePalette}
            onChooseLayout={chooseLayout}
            onChoosePlayer={togglePlayer}
          />
        </div>
      </header>

      <main
        className={[
          styles.layout,
          showNowPlaying ? LAYOUT_CLASS[layout] : styles.solo,
          showResults ? undefined : styles.noBoard,
        ]
          .filter(Boolean)
          .join(' ')}
        style={backdropStyle(palette, selected)}
      >
        {/* Always mounted, so it is on the page before it has anything to say. */}
        <p className="visually-hidden" role="status">
          {announcement(status, tracks.length)}
        </p>

        <SearchContainer
          query={query}
          view={view}
          hasPrev={hasPrev}
          hasNext={hasNext}
          showResults={showResults}
          showHint={status === 'idle' && !showNowPlaying}
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
              onForget={forget}
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
              playable={playerOn}
              embedded={embedded}
              isPlaying={isPlaying}
              lieDown={showResults && (narrow || LIE_DOWN_LAYOUTS.includes(layout))}
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

      {selected !== null && playerOn && embedded && (
        <PlayerBar
          track={selected}
          frameRef={playerRef}
          onClose={() => setEmbedded(false)}
        />
      )}
    </>
  )
}

export default App
