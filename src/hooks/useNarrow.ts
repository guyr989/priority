import { useCallback, useSyncExternalStore } from 'react'

const NARROW = '(max-width: 56.25rem)'

/**
 * True where the layout has folded to one column. Only the narrow layout runs
 * out of room, so only the narrow layout offers to fold the list away.
 */
export function useNarrow(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => {}

    const query = window.matchMedia(NARROW)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === 'function' && window.matchMedia(NARROW).matches,
    () => false,
  )
}
