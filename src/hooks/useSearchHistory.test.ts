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

  it('starts empty when the store is empty', () => {
    const { result } = renderHook(() => useSearchHistory(createMemoryStore(null)))

    expect(result.current.terms).toEqual([])
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
