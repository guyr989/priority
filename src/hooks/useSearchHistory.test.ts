import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Store } from '../storage/store'
import { useSearchHistory } from './useSearchHistory'

function createMemoryStore(initial: readonly string[] | null): Store<readonly string[]> {
  let value = initial
  return {
    read: () => value,
    write: (next) => {
      value = next
    },
  }
}

describe('useSearchHistory', () => {
  it('starts from whatever the store holds', () => {
    const { result } = renderHook(() =>
      useSearchHistory(createMemoryStore(['adele', 'pixies'])),
    )

    expect(result.current.terms).toEqual(['adele', 'pixies'])
  })

  it('writes nothing to a store that holds nothing', () => {
    let written = 0
    const store: Store<readonly string[]> = {
      read: () => null,
      write: () => {
        written += 1
      },
    }

    renderHook(() => useSearchHistory(store))

    expect(written).toBe(0)
  })

  it('writes an empty history once the store has something to empty', () => {
    const store = createMemoryStore(['adele'])
    const { result } = renderHook(() => useSearchHistory(store))

    act(() => result.current.forget('adele'))

    expect(store.read()).toEqual([])
  })

  it('starts empty when the store is empty', () => {
    const { result } = renderHook(() => useSearchHistory(createMemoryStore(null)))

    expect(result.current.terms).toEqual([])
  })

  it('keeps only the newest five when the store holds more', () => {
    const { result } = renderHook(() =>
      useSearchHistory(createMemoryStore(['a', 'b', 'c', 'd', 'e', 'f', 'g'])),
    )

    expect(result.current.terms).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('records a search at the top', () => {
    const { result } = renderHook(() => useSearchHistory(createMemoryStore(['jazz'])))

    act(() => {
      result.current.record('adele')
    })

    expect(result.current.terms).toEqual(['adele', 'jazz'])
  })

  it('persists so the next visit sees the same list', () => {
    const store = createMemoryStore([])
    const first = renderHook(() => useSearchHistory(store))

    act(() => {
      first.result.current.record('adele')
    })
    first.unmount()

    const second = renderHook(() => useSearchHistory(store))

    expect(second.result.current.terms).toEqual(['adele'])
  })
})
