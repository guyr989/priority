import { useCallback, useEffect, useState } from 'react'
import { addSearch } from '../domain/history'
import type { Store } from '../storage/store'

export interface SearchHistory {
  readonly terms: readonly string[]
  readonly record: (term: string) => void
}

export function useSearchHistory(store: Store<readonly string[]>): SearchHistory {
  const [terms, setTerms] = useState<readonly string[]>(() => store.read() ?? [])

  useEffect(() => {
    store.write(terms)
  }, [store, terms])

  const record = useCallback((term: string) => {
    setTerms((current) => addSearch(current, term))
  }, [])

  return { terms, record }
}
