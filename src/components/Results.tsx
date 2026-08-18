import type { SearchStatus } from '../hooks/useSearch'
import type { Track } from '../domain/track'
import type { ViewMode } from '../domain/view'
import styles from './Results.module.css'

interface ResultsProps {
  readonly status: SearchStatus
  readonly view: ViewMode
  readonly tracks: readonly Track[]
  readonly onSelect: (track: Track, origin: HTMLElement) => void
  readonly onRetry: () => void
}

function announcement(status: SearchStatus, count: number): string {
  if (status === 'loading') return 'Searching'
  if (status !== 'ready') return ''
  if (count === 0) return 'No tracks match that search'
  return `${count} ${count === 1 ? 'result' : 'results'} ready`
}

export function Results({ status, view, tracks, onSelect, onRetry }: ResultsProps) {
  return (
    <>
      <p className={styles.announcer} role="status">
        {announcement(status, tracks.length)}
      </p>
      {body({ status, view, tracks, onSelect, onRetry })}
    </>
  )
}

function body({ status, view, tracks, onSelect, onRetry }: ResultsProps) {
  if (status === 'error') {
    return (
      <div className={styles.message} role="alert">
        <p className={styles.error}>
          The search did not go through. Check your connection and try again.
        </p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <p className={`${styles.message} ${styles.loading}`}>Searching for tracks</p>
    )
  }

  if (status === 'idle') {
    return <p className={styles.message}>Search for a track to see results here.</p>
  }

  if (tracks.length === 0) {
    return <p className={styles.message}>No tracks match that search. Try another term.</p>
  }

  if (view === 'tile') {
    return (
      <ul className={styles.tiles}>
        {tracks.map((track) => (
          <li key={track.id}>
            <button
              type="button"
              className={styles.tile}
              onClick={(event) => onSelect(track, event.currentTarget)}
            >
              <img className={styles.tileImage} src={track.imageUrl} alt="" />
              <span className={styles.tileTitle}>{track.title}</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className={styles.list}>
      {tracks.map((track) => (
        <li key={track.id}>
          <button
            type="button"
            className={styles.result}
            onClick={(event) => onSelect(track, event.currentTarget)}
          >
            {track.title}
          </button>
        </li>
      ))}
    </ul>
  )
}
