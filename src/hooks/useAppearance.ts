import { useCallback, useLayoutEffect, useState } from 'react'
import { findAppearance } from '../domain/appearance'
import type { Appearance, AppearanceId } from '../domain/appearance'
import type { Store } from '../storage/store'

export interface AppearanceChoice {
  readonly look: Appearance
  readonly choose: (id: AppearanceId) => void
}

/**
 * One attribute on the document carries the look, so every palette and layout
 * token stays in CSS and no component has to know which look is on. Call it
 * before the first render too, or a stored dark look paints light first.
 */
export function applyAppearance(id: unknown): Appearance {
  const look = findAppearance(id)
  document.documentElement.dataset.appearance = look.id
  return look
}

export function useAppearance(store: Store<AppearanceId>): AppearanceChoice {
  const [look, setLook] = useState<Appearance>(() => findAppearance(store.read()))

  useLayoutEffect(() => {
    applyAppearance(look.id)
  }, [look])

  const choose = useCallback(
    (id: AppearanceId) => {
      const next = findAppearance(id)
      setLook(next)
      store.write(next.id)
    },
    [store],
  )

  return { look, choose }
}
