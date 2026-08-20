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

  useEffect(() => {
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
