import { useCallback, useEffect, useState } from 'react'
import { findAppearance } from '../domain/appearance'
import type { Appearance } from '../domain/appearance'
import type { Store } from '../storage/store'

export interface AppearanceChoice {
  readonly look: Appearance
  readonly choose: (id: string) => void
}

/**
 * The chosen look is a single attribute on the document, so every palette and
 * layout token stays in CSS and no component has to know which look is on.
 */
export function useAppearance(store: Store<string>): AppearanceChoice {
  const [look, setLook] = useState<Appearance>(() => findAppearance(store.read()))

  useEffect(() => {
    document.documentElement.dataset.appearance = look.id
  }, [look])

  const choose = useCallback(
    (id: string) => {
      const next = findAppearance(id)
      setLook(next)
      store.write(next.id)
    },
    [store],
  )

  return { look, choose }
}
