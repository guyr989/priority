import type { SearchStatus } from '../hooks/useSearch'
import type { Track } from '../domain/track'
import styles from './Results.module.css'

interface ResultsProps {
  readonly status: SearchStatus
  readonly tracks: readonly Track[]
  readonly onSelect: (track: Track, origin: HTMLElement) => void
  readonly onRetry: () => void
}

export function Results({ status, tracks, onSelect, onRetry }: ResultsProps) {
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
      <p className={`${styles.message} ${styles.loading}`}>Searching</p>
    )
  }

  if (status === 'idle') {
    return <p className={styles.message}>Search for a track to see results here.</p>
  }

  if (tracks.length === 0) {
    return <p className={styles.message}>No tracks match that search. Try another term.</p>
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
