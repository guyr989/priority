import { useCallback, useLayoutEffect, useState } from 'react'
import { findLayout, findPalette } from '../domain/appearance'
import type { LayoutId, Palette, PaletteId } from '../domain/appearance'
import type { Store } from '../storage/store'

export interface AppearanceChoice {
  readonly palette: Palette
  readonly layout: LayoutId
  readonly choosePalette: (id: PaletteId) => void
  readonly chooseLayout: (id: LayoutId) => void
}

/**
 * One attribute on the document carries the colours, so every palette token
 * stays in CSS and no component has to know which one is on. Call it before
 * the first render too, or a stored dark palette paints light first.
 */
export function applyPalette(id: unknown): Palette {
  const palette = findPalette(id)
  document.documentElement.dataset.palette = palette.id
  return palette
}

/**
 * Colours and arrangement are two choices, not one. Either can change without
 * the other, so any palette can wear any layout.
 */
export function useAppearance(
  paletteStore: Store<PaletteId>,
  layoutStore: Store<LayoutId>,
): AppearanceChoice {
  const [palette, setPalette] = useState<Palette>(() => findPalette(paletteStore.read()))
  const [layout, setLayout] = useState<LayoutId>(() => findLayout(layoutStore.read()))

  useLayoutEffect(() => {
    applyPalette(palette.id)
  }, [palette])

  const choosePalette = useCallback(
    (id: PaletteId) => {
      const next = findPalette(id)
      setPalette(next)
      paletteStore.write(next.id)
    },
    [paletteStore],
  )

  const chooseLayout = useCallback(
    (id: LayoutId) => {
      const next = findLayout(id)
      setLayout(next)
      layoutStore.write(next)
    },
    [layoutStore],
  )

  return { palette, layout, choosePalette, chooseLayout }
}
