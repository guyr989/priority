import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { PlaybackSource } from '../domain/playback'

/**
 * Injected by the caller so the data layer stays swappable: the element type
 * lives here, in the React layer, and never reaches domain/.
 */
export type AttachPlayback = (
  frame: HTMLIFrameElement,
) => Promise<PlaybackSource | null>

interface Report {
  readonly player: string
  readonly isPlaying: boolean
}

/**
 * Nothing is playing until the player says so. The embed asks for autoplay and
 * often does not get it, so trusting `embedded` would animate a set nobody
 * started; the source answers for itself the moment it attaches, and again when
 * the listener works the player's own transport. A new track retires the old
 * report rather than resetting state from an effect.
 */
export function usePlayback(
  frameRef: RefObject<HTMLIFrameElement | null>,
  attach: AttachPlayback,
  embedded: boolean,
  trackId: string | null,
): boolean {
  const player = `${trackId ?? ''}:${embedded}`
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!embedded || frame === null) return

    let detach: (() => void) | null = null
    let dropped = false

    void attach(frame).then((source) => {
      if (source === null) return

      // Subscribe even when we are already leaving: detaching is what releases
      // the player, and a source nobody detaches is a source nobody cleans up.
      const stop = source.subscribe((isPlaying) => setReport({ player, isPlaying }))
      if (dropped) {
        stop()
        return
      }

      detach = stop
      setReport({ player, isPlaying: source.isPlaying })
    })

    return () => {
      dropped = true
      detach?.()
    }
  }, [attach, embedded, frameRef, player])

  return report?.player === player ? report.isPlaying : false
}
