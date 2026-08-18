import { createRef } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PlaybackSource } from '../domain/playback'
import { usePlayback } from './usePlayback'

function frameRef() {
  const ref = createRef<HTMLIFrameElement>()
  Object.assign(ref, { current: document.createElement('iframe') })
  return ref
}

function createPlayer(isPlaying: boolean) {
  const detach = vi.fn()
  const subscribe = vi.fn()
  let report: ((playing: boolean) => void) | null = null

  const source: PlaybackSource = {
    isPlaying,
    subscribe(onChange) {
      subscribe()
      report = onChange
      return detach
    },
  }

  return {
    attach: () => Promise.resolve(source),
    detach,
    attached: () => waitFor(() => expect(subscribe).toHaveBeenCalled()),
    say: (playing: boolean) => act(() => report?.(playing)),
  }
}

describe('usePlayback', () => {
  it('answers with the embed until the player says otherwise', async () => {
    const player = createPlayer(true)
    const ref = frameRef()
    const { result } = renderHook(() => usePlayback(ref, player.attach, true, 'a'))

    expect(result.current).toBe(true)

    await player.attached()
    player.say(false)

    await waitFor(() => expect(result.current).toBe(false))
  })

  it('takes the state the player reports when it attaches', async () => {
    const player = createPlayer(false)
    const ref = frameRef()
    const { result } = renderHook(() => usePlayback(ref, player.attach, true, 'a'))

    await waitFor(() => expect(result.current).toBe(false))
  })

  it('stays quiet while nothing is embedded', () => {
    const attach = vi.fn()
    const ref = frameRef()
    const { result } = renderHook(() => usePlayback(ref, attach, false, null))

    expect(result.current).toBe(false)
    expect(attach).not.toHaveBeenCalled()
  })

  it('keeps the embed state when the player cannot be reached', async () => {
    const attach = () => Promise.resolve(null)
    const ref = frameRef()
    const { result } = renderHook(() => usePlayback(ref, attach, true, 'a'))

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('lets go of the player on the way out', async () => {
    const player = createPlayer(true)
    const ref = frameRef()
    const { unmount } = renderHook(() => usePlayback(ref, player.attach, true, 'a'))

    await player.attached()
    unmount()

    expect(player.detach).toHaveBeenCalledOnce()
  })
})
