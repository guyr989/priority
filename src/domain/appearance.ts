/** The colours. Independent of how the page is arranged. */
export type PaletteId = "studio" | "cinema" | "daylight"

/** The arrangement. Independent of what colour it is painted. */
export type LayoutId = "side" | "stack" | "banner" | "row"

export type SchemeName = "auto" | "light" | "dark"

export interface Palette {
    readonly id: PaletteId
    readonly scheme: SchemeName
    /** The chosen cover paints the page behind the panels. */
    readonly coverBackdrop: boolean
}

const STUDIO: Palette = { id: "studio", scheme: "auto", coverBackdrop: false }
const CINEMA: Palette = { id: "cinema", scheme: "dark", coverBackdrop: true }
const DAYLIGHT: Palette = { id: "daylight", scheme: "light", coverBackdrop: false }

export const PALETTES: readonly Palette[] = [STUDIO, CINEMA, DAYLIGHT]

/**
 * Cinema is what a first visit opens on. It is the same object the list
 * holds, not a second copy of it, so the default cannot drift from the entry
 * it names or quietly add a fifth palette.
 */
export const DEFAULT_PALETTE: Palette = CINEMA

export const DEFAULT_LAYOUT: LayoutId = "side"

export const LAYOUTS: readonly LayoutId[] = ["side", "stack", "banner", "row"]

export function isPaletteId(value: unknown): value is PaletteId {
    return PALETTES.some((palette) => palette.id === value)
}

export function isLayoutId(value: unknown): value is LayoutId {
    return LAYOUTS.some((layout) => layout === value)
}

/** Anything unknown, missing or stale comes back as the default. */
export function findPalette(id: unknown): Palette {
    return PALETTES.find((palette) => palette.id === id) ?? DEFAULT_PALETTE
}

export function findLayout(id: unknown): LayoutId {
    return isLayoutId(id) ? id : DEFAULT_LAYOUT
}
