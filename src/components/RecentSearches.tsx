import styles from './RecentSearches.module.css'

interface RecentSearchesProps {
  readonly terms: readonly string[]
  readonly onSelect: (term: string) => void
}

export function RecentSearches({ terms, onSelect }: RecentSearchesProps) {
  return (
    <section className={styles.container} aria-labelledby="recent-heading">
      <h2 id="recent-heading" className={styles.heading}>
        Recent searches
      </h2>

      {terms.length === 0 ? (
        <p className={styles.empty}>Searches you make show up here.</p>
      ) : (
        <ul className={styles.list}>
          {terms.map((term) => (
            <li key={term}>
              <button
                type="button"
                className={styles.term}
                onClick={() => onSelect(term)}
              >
                {term}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
