import { useEffect, useState } from 'react'
import {
  canGoNext,
  canGoPrev,
  goNext,
  goPrev,
  initialPagination,
  receivePage,
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
  readonly restart: () => void
}

export function useSearch(
  provider: SoundProvider,
  query: string,
  debounceMs: number,
): SearchResult {
  const [tracks, setTracks] = useState<readonly Track[]>([])
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)
  const [requestCount, setRequestCount] = useState(0)
  const [activeQuery, setActiveQuery] = useState(query)

  if (query !== activeQuery) {
    setActiveQuery(query)
    setPagination(initialPagination)
    setTracks([])
  }

  const cursor = pagination.cursor

  useEffect(() => {
    if (query === '') return

    const controller = new AbortController()
    let current = true

    const timer = setTimeout(
      () => {
        provider
          .search(query, cursor, controller.signal)
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
      },
      cursor === null ? debounceMs : 0,
    )

    return () => {
      clearTimeout(timer)
      controller.abort()
      current = false
    }
  }, [provider, query, cursor, requestCount, debounceMs])

  return {
    tracks,
    hasNext: canGoNext(pagination),
    hasPrev: canGoPrev(pagination),
    goToNextPage: () => {
      setPagination(goNext)
      setRequestCount((count) => count + 1)
    },
    goToPrevPage: () => {
      setPagination(goPrev)
      setRequestCount((count) => count + 1)
    },
    restart: () => {
      setPagination(initialPagination)
      setRequestCount((count) => count + 1)
    },
  }
}
