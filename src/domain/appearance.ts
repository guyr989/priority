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
    /** Whether this look carries a player until the visitor says otherwise. */
    readonly showsPlayer: boolean
    /** The chosen cover paints the page behind the panels. */
    readonly coverBackdrop: boolean
}

/** What a first-time visitor gets. The brief makes the player mandatory, so it shows one. */
export const DEFAULT_APPEARANCE: Appearance = {
    id: "studio",
    layout: "side",
    scheme: "auto",
    showsPlayer: true,
    coverBackdrop: false,
}

export const APPEARANCES: readonly Appearance[] = [
    DEFAULT_APPEARANCE,
    { id: "after-hours", layout: "stack", scheme: "dark", showsPlayer: true, coverBackdrop: false },
    { id: "riso", layout: "banner", scheme: "light", showsPlayer: true, coverBackdrop: false },
    { id: "gallery", layout: "banner", scheme: "auto", showsPlayer: false, coverBackdrop: false },
    { id: "desk", layout: "row", scheme: "dark", showsPlayer: true, coverBackdrop: false },
    { id: "daylight", layout: "row", scheme: "light", showsPlayer: true, coverBackdrop: false },
    { id: "cinema", layout: "stack", scheme: "dark", showsPlayer: true, coverBackdrop: true },
    { id: "poster", layout: "stack", scheme: "light", showsPlayer: true, coverBackdrop: true },
]

export function isAppearanceId(value: unknown): value is AppearanceId {
    return APPEARANCES.some((look) => look.id === value)
}

/** Anything unknown, missing or stale comes back as the default look. */
export function findAppearance(id: unknown): Appearance {
    return APPEARANCES.find((look) => look.id === id) ?? DEFAULT_APPEARANCE
}

/**
 * The visitor's override, one entry per look they have touched. A look that is
 * absent has never been touched, so it falls back to its own default. Storing
 * the override rather than the answer is what keeps a first visit on Studio
 * carrying a player, which requirement 6 makes mandatory.
 */
export type PlayerPreference = Readonly<Partial<Record<AppearanceId, boolean>>>

export const NO_PLAYER_PREFERENCE: PlayerPreference = {}

export function playerShown(look: Appearance, prefs: PlayerPreference): boolean {
    return prefs[look.id] ?? look.showsPlayer
}

export function withPlayerShown(
    prefs: PlayerPreference,
    id: AppearanceId,
    shown: boolean,
): PlayerPreference {
    return { ...prefs, [id]: shown }
}

export function isPlayerPreference(value: unknown): value is PlayerPreference {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false

    return Object.entries(value).every(
        ([id, shown]) => isAppearanceId(id) && typeof shown === "boolean",
    )
}
