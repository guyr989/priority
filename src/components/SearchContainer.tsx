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
  readonly recent: ReactNode
  /** The list can be folded away once it has something in it. */
  readonly collapsible: boolean
  readonly resultsOpen: boolean
  readonly onResultsOpenChange: (open: boolean) => void
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
  recent,
  collapsible,
  resultsOpen,
  onResultsOpenChange,
  children,
}: SearchContainerProps) {
  const folded = collapsible && !resultsOpen

  return (
    <section className={styles.container} aria-label="Search">
      <div className={styles.head}>
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
            placeholder="Artist, show, or track"
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button className={styles.go} type="submit">
            Search
          </button>
        </form>

        {recent}
      </div>

      {/* One box holds the list, the controls that reshape it and the page
          turns that move it, so nothing that acts on the list sits outside. */}
      <div className={styles.board}>
        <div className={styles.toolbar}>
          {collapsible ? (
            <button
              type="button"
              className={styles.toolbarToggle}
              id="results-label"
              aria-expanded={resultsOpen}
              aria-controls="results-list"
              onClick={() => onResultsOpenChange(!resultsOpen)}
            >
              <svg
                className={styles.chevron}
                viewBox="0 0 16 16"
                width="13"
                height="13"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M4 6.5 8 10.5 12 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Results
            </button>
          ) : (
            <span className={styles.toolbarLabel} id="results-label">
              Results
            </span>
          )}

          <div
            className={styles.views}
            role="group"
            aria-label="Result layout"
            hidden={folded}
          >
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
              aria-label="Grid"
              aria-pressed={view === 'tile'}
              title="Grid"
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

        <div
          id="results-list"
          className={styles.results}
          aria-labelledby="results-label"
          hidden={folded}
        >
          {children}
        </div>

        <div className={styles.paging} role="group" aria-label="Result pages" hidden={folded}>
          <button type="button" onClick={onPrev} disabled={!hasPrev}>
            Previous
          </button>
          <button type="button" onClick={onNext} disabled={!hasNext}>
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
