import { useCallback, useEffect, useState } from 'react'
import { addSearch, HISTORY_LIMIT } from '../domain/history'
import type { Store } from '../storage/store'

export interface SearchHistory {
  readonly terms: readonly string[]
  readonly record: (term: string) => void
  readonly forget: (term: string) => void
}

export function useSearchHistory(store: Store<readonly string[]>): SearchHistory {
  const [terms, setTerms] = useState<readonly string[]>(
    () => store.read()?.slice(0, HISTORY_LIMIT) ?? [],
  )

  /*
   * An empty history writes nothing when nothing is stored. Without that
   * guard, mounting on a device that has just been cleared put the key
   * straight back as [], which behaves identically but reads as a clear that
   * failed. Once a key exists, an empty list is written like any other: it is
   * how forgetting the last term is kept.
   */
  useEffect(() => {
    if (terms.length === 0 && store.read() === null) return
    store.write(terms)
  }, [store, terms])

  const record = useCallback((term: string) => {
    setTerms((current) => addSearch(current, term))
  }, [])

  // ponytail: the rule itself belongs beside addSearch in domain/history.ts.
  // Left here only because domain/ is Guy's to write.
  const forget = useCallback((term: string) => {
    setTerms((current) => current.filter((kept) => kept !== term))
  }, [])

  return { terms, record, forget }
}
