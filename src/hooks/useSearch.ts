import { useEffect, useState } from 'react'
import type { SoundProvider } from '../domain/soundProvider'
import type { Track } from '../domain/track'

export function useSearch(
  provider: SoundProvider,
  query: string,
): readonly Track[] {
  const [tracks, setTracks] = useState<readonly Track[]>([])

  useEffect(() => {
    if (query === '') {
      setTracks([])
      return
    }

    // Slice 6 adds the 300ms debounce, slice 7 the AbortController and
    // generation guard. Until then this fires per keystroke and the last
    // response to land wins.
    provider
      .search(query, null, new AbortController().signal)
      .then((page) => setTracks(page.items))
      .catch(() => setTracks([]))
  }, [provider, query])

  return tracks
}
