import { useEffect, useState } from 'react'
import type { SoundProvider } from '../domain/soundProvider'
import type { Track } from '../domain/track'

export function useSearch(
  provider: SoundProvider,
  query: string,
  debounceMs: number,
): readonly Track[] {
  const [tracks, setTracks] = useState<readonly Track[]>([])

  useEffect(() => {
    if (query === '') {
      setTracks([])
      return
    }
    const controller = new AbortController()
    let current = true
    const timer = setTimeout(() => {
      provider
        .search(query, null, controller.signal)
        .then((page) => {
          if (current) {
            setTracks(page.items)
          }
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
  }, [provider, query, debounceMs])

  return tracks
}
