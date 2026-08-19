import { useCallback, useLayoutEffect, useState } from 'react'
import {
  findAppearance,
  NO_PLAYER_PREFERENCE,
  playerShown,
  withPlayerShown,
} from '../domain/appearance'
import type { Appearance, AppearanceId, PlayerPreference } from '../domain/appearance'
import type { Store } from '../storage/store'

export interface AppearanceChoice {
  readonly look: Appearance
  /** Whether the current look is carrying a player right now. */
  readonly showsPlayer: boolean
  /** Every look's answer, so the picker can draw eight switches. */
  readonly players: PlayerPreference
  readonly choose: (id: AppearanceId) => void
  readonly setPlayerShown: (id: AppearanceId, shown: boolean) => void
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

export function useAppearance(
  store: Store<AppearanceId>,
  playerStore: Store<PlayerPreference>,
): AppearanceChoice {
  const [look, setLook] = useState<Appearance>(() => findAppearance(store.read()))
  const [players, setPlayers] = useState<PlayerPreference>(
    () => playerStore.read() ?? NO_PLAYER_PREFERENCE,
  )

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

  const setPlayerShown = useCallback(
    (id: AppearanceId, shown: boolean) => {
      setPlayers((current) => {
        const next = withPlayerShown(current, id, shown)
        playerStore.write(next)
        return next
      })
    },
    [playerStore],
  )

  return { look, showsPlayer: playerShown(look, players), players, choose, setPlayerShown }
}
