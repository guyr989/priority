export type LayoutName = "side" | "stack" | "banner"
export type SchemeName = "auto" | "light" | "dark"

export interface Appearance {
    readonly id: string
    /** What the listener sees in the picker. */
    readonly name: string
    /** One line saying what changes, including anything the look takes away. */
    readonly note: string
    readonly layout: LayoutName
    readonly scheme: SchemeName
    readonly showsPlayer: boolean
}

/** The first entry is what a first-time visitor gets. */
export const APPEARANCES: readonly Appearance[] = [
    {
        id: "studio",
        name: "Studio",
        note: "Daylight panels, violet accent. Follows your system theme.",
        layout: "side",
        scheme: "auto",
        showsPlayer: true,
    },
    {
        id: "after-hours",
        name: "After hours",
        note: "Dark room, sodium light. One column, the sleeve up top.",
        layout: "stack",
        scheme: "dark",
        showsPlayer: true,
    },
    {
        id: "riso",
        name: "Riso",
        note: "Flyer print: blue and pink on paper, sleeve across the top.",
        layout: "banner",
        scheme: "light",
        showsPlayer: true,
    },
    {
        id: "gallery",
        name: "Gallery",
        note: "Monochrome, oversized sleeve, no player on the page.",
        layout: "banner",
        scheme: "auto",
        showsPlayer: false,
    },
]

export const DEFAULT_APPEARANCE: Appearance = APPEARANCES[0]!

export function isAppearanceId(value: unknown): value is string {
    return typeof value === "string" && APPEARANCES.some((look) => look.id === value)
}

/** Anything unknown, missing or stale comes back as the default look. */
export function findAppearance(id: unknown): Appearance {
    return APPEARANCES.find((look) => look.id === id) ?? DEFAULT_APPEARANCE
}
