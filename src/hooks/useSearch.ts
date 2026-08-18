import { useCallback, useEffect, useState } from 'react'
import {
  canGoNext,
  canGoPrev,
  goNext,
  goPrev,
  initialPagination,
  receivePage,
  resetPagination,
  type PaginationState,
} from '../domain/pagination'
import type { SoundProvider } from '../domain/soundProvider'
import type { Track } from '../domain/track'

export interface SearchResult {
  readonly tracks: readonly Track[]
  readonly hasNext: boolean
  readonly hasPrev: boolean
  readonly goToNextPage: () => void
  readonly goToPrevPage: () => void
}

export function useSearch(
  provider: SoundProvider,
  query: string,
  debounceMs: number,
): SearchResult {
  const [tracks, setTracks] = useState<readonly Track[]>([])
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)
  const [activeQuery, setActiveQuery] = useState(query)

  if (query !== activeQuery) {
    setActiveQuery(query)
    setPagination(resetPagination())
  }

  useEffect(() => {
    if (query === '') {
      setTracks([])
      return
    }

    const controller = new AbortController()
    let current = true

    const timer = setTimeout(() => {
      provider
        .search(query, pagination.cursor, controller.signal)
        .then((page) => {
          if (!current) return
          setTracks(page.items)
          setPagination((state) => receivePage(state, page))
        })
        .catch((error: unknown) => {
          if (!current) return
          if (!(error instanceof Error) || error.name !== 'AbortError') {
            setTracks([])
          }
        })
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      controller.abort()
      current = false
    }
  }, [provider, query, pagination.cursor, debounceMs])

  const goToNextPage = useCallback(() => setPagination(goNext), [])
  const goToPrevPage = useCallback(() => setPagination(goPrev), [])

  return {
    tracks,
    hasNext: canGoNext(pagination),
    hasPrev: canGoPrev(pagination),
    goToNextPage,
    goToPrevPage,
  }
}
