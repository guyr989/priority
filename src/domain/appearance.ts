export type AppearanceId =
    | "studio"
    | "after-hours"
    | "riso"
    | "gallery"
    | "desk"
    | "daylight"
    | "cinema"
    | "poster"

export type LayoutName = "side" | "stack" | "banner" | "row"
export type SchemeName = "auto" | "light" | "dark"

export interface Appearance {
    readonly id: AppearanceId
    readonly layout: LayoutName
    readonly scheme: SchemeName
    /** The chosen cover paints the page behind the panels. */
    readonly coverBackdrop: boolean
}

/** What a first-time visitor gets. */
export const DEFAULT_APPEARANCE: Appearance = {
    id: "studio",
    layout: "side",
    scheme: "auto",
    coverBackdrop: false,
}

export const APPEARANCES: readonly Appearance[] = [
    DEFAULT_APPEARANCE,
    { id: "after-hours", layout: "stack", scheme: "dark", coverBackdrop: false },
    { id: "riso", layout: "banner", scheme: "light", coverBackdrop: false },
    { id: "gallery", layout: "banner", scheme: "auto", coverBackdrop: false },
    { id: "desk", layout: "row", scheme: "dark", coverBackdrop: false },
    { id: "daylight", layout: "row", scheme: "light", coverBackdrop: false },
    { id: "cinema", layout: "stack", scheme: "dark", coverBackdrop: true },
    { id: "poster", layout: "stack", scheme: "light", coverBackdrop: true },
]

export function isAppearanceId(value: unknown): value is AppearanceId {
    return APPEARANCES.some((look) => look.id === value)
}

/** Anything unknown, missing or stale comes back as the default look. */
export function findAppearance(id: unknown): Appearance {
    return APPEARANCES.find((look) => look.id === id) ?? DEFAULT_APPEARANCE
}
