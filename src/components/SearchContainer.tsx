import type { ReactNode } from 'react'
import type { ViewMode } from '../domain/view'
import styles from './SearchContainer.module.css'

interface SearchContainerProps {
  readonly query: string
  readonly view: ViewMode
  readonly hasPrev: boolean
  readonly hasNext: boolean
  readonly onQueryChange: (query: string) => void
  readonly onSubmit: () => void
  readonly onViewChange: (view: ViewMode) => void
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly children: ReactNode
}

export function SearchContainer({
  query,
  view,
  hasPrev,
  hasNext,
  onQueryChange,
  onSubmit,
  onViewChange,
  onPrev,
  onNext,
  children,
}: SearchContainerProps) {
  return (
    <section className={styles.container} aria-labelledby="search-heading">
      <h2 id="search-heading" className={styles.heading}>
        Search
      </h2>

      <form
        className={styles.form}
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className={styles.label} htmlFor="search-input">
          Search tracks
        </label>
        <input
          id="search-input"
          className={styles.input}
          type="search"
          value={query}
          autoComplete="off"
          placeholder="Search for a track"
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button className={styles.go} type="submit">
          Go
        </button>
      </form>

      <div className={styles.results}>{children}</div>

      <div className={styles.controls}>
        <div className={styles.paging} role="group" aria-label="Result pages">
          <button type="button" onClick={onPrev} disabled={!hasPrev}>
            Previous
          </button>
          <button type="button" onClick={onNext} disabled={!hasNext}>
            Next
          </button>
        </div>

        <div className={styles.views} role="group" aria-label="Result layout">
          <button
            type="button"
            className={styles.view}
            aria-label="List"
            aria-pressed={view === 'list'}
            title="List"
            onClick={() => onViewChange('list')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={styles.view}
            aria-label="Tile"
            aria-pressed={view === 'tile'}
            title="Tile"
            onClick={() => onViewChange('tile')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
