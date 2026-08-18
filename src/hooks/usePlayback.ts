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
 * The embed autoplays, so `embedded` is the honest first answer. Once the
 * player answers for itself it wins, including when the listener presses pause
 * on the player's own transport. A new track retires the old report rather
 * than resetting state from an effect.
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
      if (source === null || dropped) return

      setReport({ player, isPlaying: source.isPlaying })
      detach = source.subscribe((isPlaying) => setReport({ player, isPlaying }))
    })

    return () => {
      dropped = true
      detach?.()
    }
  }, [attach, embedded, frameRef, player])

  return report?.player === player ? report.isPlaying : embedded
}
