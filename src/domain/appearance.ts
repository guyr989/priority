export type AppearanceId = "studio" | "after-hours" | "riso" | "gallery"
export type LayoutName = "side" | "stack" | "banner"
export type SchemeName = "auto" | "light" | "dark"

export interface Appearance {
    readonly id: AppearanceId
    readonly layout: LayoutName
    readonly scheme: SchemeName
    readonly showsPlayer: boolean
}

/** What a first-time visitor gets. The brief makes the player mandatory, so it shows one. */
export const DEFAULT_APPEARANCE: Appearance = {
    id: "studio",
    layout: "side",
    scheme: "auto",
    showsPlayer: true,
}

export const APPEARANCES: readonly Appearance[] = [
    DEFAULT_APPEARANCE,
    { id: "after-hours", layout: "stack", scheme: "dark", showsPlayer: true },
    { id: "riso", layout: "banner", scheme: "light", showsPlayer: true },
    { id: "gallery", layout: "banner", scheme: "auto", showsPlayer: false },
]

export function isAppearanceId(value: unknown): value is AppearanceId {
    return APPEARANCES.some((look) => look.id === value)
}

/** Anything unknown, missing or stale comes back as the default look. */
export function findAppearance(id: unknown): Appearance {
    return APPEARANCES.find((look) => look.id === id) ?? DEFAULT_APPEARANCE
}
