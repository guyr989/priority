import styles from './RecentSearches.module.css'
import { strings } from '../i18n/strings'

interface RecentSearchesProps {
  readonly terms: readonly string[]
  readonly onSelect: (term: string) => void
  readonly onForget: (term: string) => void
}

export function RecentSearches({ terms, onSelect, onForget }: RecentSearchesProps) {
  if (terms.length === 0) return null

  return (
    <section className={styles.container} aria-labelledby="recent-heading">
      <h2 id="recent-heading" className={styles.heading}>
        {strings.history.heading}
      </h2>

      <ul className={styles.list}>
        {terms.map((term) => (
          <li key={term} className={styles.item}>
            <button
              type="button"
              className={styles.term}
              onClick={() => onSelect(term)}
            >
              {term}
            </button>
            <button
              type="button"
              className={styles.forget}
              aria-label={strings.history.forget(term)}
              title={strings.history.forget(term)}
              onClick={() => onForget(term)}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
