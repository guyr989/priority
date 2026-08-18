import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Page } from '../domain/page'
import type { SoundProvider } from '../domain/soundProvider'
import type { Track } from '../domain/track'
import { useSearch } from './useSearch'

interface PendingCall {
  readonly query: string
  readonly cursor: string | null
  readonly signal: AbortSignal
  readonly resolve: (page: Page<Track>) => void
  readonly reject: (error: unknown) => void
}

function createProvider() {
  const calls: PendingCall[] = []
  const provider: SoundProvider = {
    search: (query, cursor, signal) =>
      new Promise<Page<Track>>((resolve, reject) => {
        calls.push({ query, cursor, signal, resolve, reject })
      }),
  }
  return { provider, calls }
}

function track(id: string): Track {
  return { id, title: id, artist: 'artist', imageUrl: '', embedUrl: '' }
}

function page(
  ids: readonly string[],
  nextCursor: string | null,
  prevCursor: string | null,
): Page<Track> {
  return { items: ids.map(track), nextCursor, prevCursor }
}

function callAt(calls: readonly PendingCall[], index: number): PendingCall {
  const call = calls[index]
  if (call === undefined) throw new Error(`no provider call at index ${index}`)
  return call
}

const DEBOUNCE = 300

async function flushDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(DEBOUNCE)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSearch paging', () => {
  it('asks for the first page with no cursor', async () => {
    const { provider, calls } = createProvider()
    renderHook(() => useSearch(provider, 'adele', DEBOUNCE))

    await flushDebounce()

    expect(calls).toHaveLength(1)
    expect(callAt(calls, 0).cursor).toBeNull()
  })

  it('enables Next only when the page reports a next cursor', async () => {
    const { provider, calls } = createProvider()
    const { result } = renderHook(() => useSearch(provider, 'adele', DEBOUNCE))

    await flushDebounce()
    expect(result.current.hasNext).toBe(false)

    await act(async () => {
      callAt(calls, 0).resolve(page(['a'], 'cursor-2', null))
    })

    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrev).toBe(false)
  })

  it('fetches the next page with the cursor the API returned', async () => {
    const { provider, calls } = createProvider()
    const { result } = renderHook(() => useSearch(provider, 'adele', DEBOUNCE))

    await flushDebounce()
    await act(async () => {
      callAt(calls, 0).resolve(page(['a'], 'cursor-2', null))
    })
    act(() => {
      result.current.goToNextPage()
    })
    await flushDebounce()

    expect(calls).toHaveLength(2)
    expect(callAt(calls, 1).cursor).toBe('cursor-2')
  })

  it('ignores Next clicks while a page is in flight', async () => {
    const { provider, calls } = createProvider()
    const { result } = renderHook(() => useSearch(provider, 'adele', DEBOUNCE))

    await flushDebounce()
    await act(async () => {
      callAt(calls, 0).resolve(page(['a'], 'cursor-2', null))
    })
    act(() => {
      result.current.goToNextPage()
      result.current.goToNextPage()
      result.current.goToNextPage()
    })
    await flushDebounce()

    expect(calls).toHaveLength(2)
    expect(result.current.hasNext).toBe(false)
  })

  it('shows the second page and offers a way back', async () => {
    const { provider, calls } = createProvider()
    const { result } = renderHook(() => useSearch(provider, 'adele', DEBOUNCE))

    await flushDebounce()
    await act(async () => {
      callAt(calls, 0).resolve(page(['a'], 'cursor-2', null))
    })
    act(() => {
      result.current.goToNextPage()
    })
    await flushDebounce()
    await act(async () => {
      callAt(calls, 1).resolve(page(['b'], 'cursor-3', 'cursor-1'))
    })

    expect(result.current.tracks.map((item) => item.id)).toEqual(['b'])
    expect(result.current.hasPrev).toBe(true)

    act(() => {
      result.current.goToPrevPage()
    })
    await flushDebounce()

    expect(callAt(calls, 2).cursor).toBe('cursor-1')
  })

  it('goes back to the first page when the query changes', async () => {
    const { provider, calls } = createProvider()
    const { rerender } = renderHook(
      ({ query }) => useSearch(provider, query, DEBOUNCE),
      { initialProps: { query: 'adele' } },
    )

    await flushDebounce()
    await act(async () => {
      callAt(calls, 0).resolve(page(['a'], 'cursor-2', null))
    })

    rerender({ query: 'adele live' })
    await flushDebounce()

    expect(callAt(calls, 1).query).toBe('adele live')
    expect(callAt(calls, 1).cursor).toBeNull()
  })

  it('aborts the in-flight request and ignores its result when the query changes', async () => {
    const { provider, calls } = createProvider()
    const { result, rerender } = renderHook(
      ({ query }) => useSearch(provider, query, DEBOUNCE),
      { initialProps: { query: 'a' } },
    )

    await flushDebounce()
    rerender({ query: 'adele' })
    await flushDebounce()

    expect(callAt(calls, 0).signal.aborted).toBe(true)

    await act(async () => {
      callAt(calls, 0).resolve(page(['stale'], null, null))
      callAt(calls, 1).resolve(page(['fresh'], null, null))
    })

    expect(result.current.tracks.map((item) => item.id)).toEqual(['fresh'])
  })

  it('clears results when the query is emptied', async () => {
    const { provider, calls } = createProvider()
    const { result, rerender } = renderHook(
      ({ query }) => useSearch(provider, query, DEBOUNCE),
      { initialProps: { query: 'adele' } },
    )

    await flushDebounce()
    await act(async () => {
      callAt(calls, 0).resolve(page(['a'], 'cursor-2', null))
    })

    rerender({ query: '' })
    await flushDebounce()

    expect(result.current.tracks).toEqual([])
    expect(result.current.hasNext).toBe(false)
    expect(calls).toHaveLength(1)
  })
})
