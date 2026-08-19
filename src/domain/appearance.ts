/** The colours. Independent of how the page is arranged. */
export type PaletteId = "studio" | "desk" | "cinema" | "daylight"

/** The arrangement. Independent of what colour it is painted. */
export type LayoutId = "side" | "stack" | "banner" | "row"

export type SchemeName = "auto" | "light" | "dark"

export interface Palette {
    readonly id: PaletteId
    readonly scheme: SchemeName
    /** The chosen cover paints the page behind the panels. */
    readonly coverBackdrop: boolean
}

export const DEFAULT_PALETTE: Palette = {
    id: "studio",
    scheme: "auto",
    coverBackdrop: false,
}

export const PALETTES: readonly Palette[] = [
    DEFAULT_PALETTE,
    { id: "desk", scheme: "dark", coverBackdrop: false },
    { id: "cinema", scheme: "dark", coverBackdrop: true },
    { id: "daylight", scheme: "light", coverBackdrop: false },
]

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
