import type { ReactNode } from 'react'
import type { ViewMode } from '../domain/view'
import styles from './SearchContainer.module.css'
import { strings } from '../i18n/strings'

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
  /**
   * Whether the board is on the page at all. Once a track is picked on a
   * window with one column the results have done their job, so they leave
   * rather than sit folded: a new search or a recent term brings them back.
   */
  readonly showResults: boolean
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
  showResults,
  children,
}: SearchContainerProps) {
  return (
    <section className={styles.container} aria-label={strings.search.region}>
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
            {strings.search.label}
          </label>
          <input
            id="search-input"
            className={styles.input}
            type="search"
            value={query}
            autoComplete="off"
            placeholder={strings.search.placeholder}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button className={styles.go} type="submit">
            {strings.search.submit}
          </button>
        </form>

        {recent}
      </div>

      {/* One box holds the list, the controls that reshape it and the page
          turns that move it, so nothing that acts on the list sits outside. */}
      {showResults && (
        <div className={styles.board}>
          {/* One control, and it names the view you are about to get rather
              than the one you are already looking at. */}
          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.view}
              aria-label={view === 'list' ? strings.results.toGrid : strings.results.toList}
              aria-pressed={view === 'tile'}
              title={view === 'list' ? strings.results.toGrid : strings.results.toList}
              onClick={() => onViewChange(view === 'list' ? 'tile' : 'list')}
            >
              {view === 'list' ? (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  <path
                    d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>

          <div id="results-list" className={styles.results} aria-label={strings.results.region}>
            {children}
          </div>

          {/* Laid over the board, not stacked under it, so the results keep
              the whole box. The group itself takes no pointer events; only the
              two buttons do, and the list is inset so no result sits under
              one. */}
          <div className={styles.paging} role="group" aria-label={strings.results.pages}>
            <button
              type="button"
              className={styles.turn}
              aria-label={strings.results.previous}
              title={strings.results.previous}
              onClick={onPrev}
              disabled={!hasPrev}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path
                  d="M15 5 8 12l7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={styles.turn}
              aria-label={strings.results.next}
              title={strings.results.next}
              onClick={onNext}
              disabled={!hasNext}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path
                  d="M9 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
