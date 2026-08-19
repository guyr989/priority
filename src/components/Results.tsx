import type { SearchStatus } from '../hooks/useSearch'
import type { Track } from '../domain/track'
import type { ViewMode } from '../domain/view'
import styles from './Results.module.css'

interface ResultsProps {
  readonly status: SearchStatus
  readonly view: ViewMode
  readonly tracks: readonly Track[]
  readonly showingId: string | null
  readonly onSelect: (track: Track, origin: HTMLElement) => void
  readonly onRetry: () => void
}

function announcement(status: SearchStatus, count: number): string {
  if (status === 'loading') return 'Searching'
  if (status !== 'ready') return ''
  if (count === 0) return 'Nothing found'
  return `${count} ${count === 1 ? 'result' : 'results'} ready`
}

export function Results({
  status,
  view,
  tracks,
  showingId,
  onSelect,
  onRetry,
}: ResultsProps) {
  return (
    <>
      <p className="visually-hidden" role="status">
        {announcement(status, tracks.length)}
      </p>
      <ResultsBody
        status={status}
        view={view}
        tracks={tracks}
        showingId={showingId}
        onSelect={onSelect}
        onRetry={onRetry}
      />
    </>
  )
}

function ResultsBody({
  status,
  view,
  tracks,
  showingId,
  onSelect,
  onRetry,
}: ResultsProps) {
  if (status === 'error') {
    return (
      <div className={styles.message} role="alert">
        <p className={styles.error}>
          That search did not land. Check your connection, then try again.
        </p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  // Paging keeps the page you are on until the next one lands, so the list
  // never blanks and never changes height under the pointer.
  const busy = status === 'loading'

  if (tracks.length === 0) {
    if (busy) return <p className={`${styles.message} ${styles.loading}`}>Digging</p>
    if (status === 'idle') return <p className={styles.message}>Type a name and start digging.</p>

    return <p className={styles.message}>Nothing under that name. Try a shorter one.</p>
  }

  if (view === 'tile') {
    return (
      <ul
        className={busy ? `${styles.tiles} ${styles.busy}` : styles.tiles}
        aria-busy={busy}
      >
        {tracks.map((track) => (
          <li key={track.id}>
            <button
              type="button"
              className={styles.tile}
              aria-current={track.id === showingId}
              onClick={(event) => onSelect(track, event.currentTarget)}
            >
              <img
                className={styles.tileImage}
                src={track.imageUrl}
                referrerPolicy="no-referrer"
                alt=""
              />
              <span className={styles.tileTitle}>{track.title}</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul
      className={busy ? `${styles.list} ${styles.busy}` : styles.list}
      aria-busy={busy}
    >
      {tracks.map((track) => (
        <li key={track.id}>
          <button
            type="button"
            className={styles.result}
            aria-current={track.id === showingId}
            onClick={(event) => onSelect(track, event.currentTarget)}
          >
            {track.title}
          </button>
        </li>
      ))}
    </ul>
  )
}
