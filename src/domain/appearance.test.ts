import { describe, expect, it } from "vitest"
import {
    APPEARANCES,
    DEFAULT_APPEARANCE,
    findAppearance,
    isAppearanceId,
    isPlayerPreference,
    NO_PLAYER_PREFERENCE,
    playerShown,
    withPlayerShown,
} from "./appearance"

describe("appearance", () => {
    it("keeps the ids unique", () => {
        const ids = APPEARANCES.map((look) => look.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("starts every visitor on a look that shows the player", () => {
        expect(DEFAULT_APPEARANCE.showsPlayer).toBe(true)
        expect(APPEARANCES[0]).toBe(DEFAULT_APPEARANCE)
    })

    it("offers a look without a player, but never as the default", () => {
        const quiet = APPEARANCES.filter((look) => !look.showsPlayer)

        expect(quiet.length).toBeGreaterThan(0)
        expect(quiet).not.toContain(DEFAULT_APPEARANCE)
    })

    it("only accepts an id it knows", () => {
        expect(isAppearanceId("riso")).toBe(true)
        expect(isAppearanceId("neon")).toBe(false)
        expect(isAppearanceId(7)).toBe(false)
        expect(isAppearanceId(null)).toBe(false)
    })

    it("falls back to the default rather than breaking on a stale id", () => {
        expect(findAppearance("gallery").id).toBe("gallery")
        expect(findAppearance("removed-look")).toBe(DEFAULT_APPEARANCE)
        expect(findAppearance(undefined)).toBe(DEFAULT_APPEARANCE)
    })
})

describe("player preference", () => {
    it("falls back to the look's own default until the visitor says otherwise", () => {
        expect(playerShown(DEFAULT_APPEARANCE, NO_PLAYER_PREFERENCE)).toBe(true)
        expect(playerShown(findAppearance("gallery"), NO_PLAYER_PREFERENCE)).toBe(false)
    })

    it("lets a visitor turn the player off on a look that ships with one", () => {
        const prefs = withPlayerShown(NO_PLAYER_PREFERENCE, "studio", false)

        expect(playerShown(DEFAULT_APPEARANCE, prefs)).toBe(false)
        expect(playerShown(findAppearance("after-hours"), prefs)).toBe(true)
    })

    it("lets a visitor turn the player on for the look that ships without one", () => {
        const prefs = withPlayerShown(NO_PLAYER_PREFERENCE, "gallery", true)

        expect(playerShown(findAppearance("gallery"), prefs)).toBe(true)
    })

    it("leaves the stored map untouched when one look changes", () => {
        const prefs = withPlayerShown(NO_PLAYER_PREFERENCE, "studio", false)
        const next = withPlayerShown(prefs, "riso", false)

        expect(prefs).toEqual({ studio: false })
        expect(next).toEqual({ studio: false, riso: false })
    })

    it("rejects anything that is not a map of known ids to booleans", () => {
        expect(isPlayerPreference({})).toBe(true)
        expect(isPlayerPreference({ studio: false })).toBe(true)
        expect(isPlayerPreference({ neon: false })).toBe(false)
        expect(isPlayerPreference({ studio: "no" })).toBe(false)
        expect(isPlayerPreference([])).toBe(false)
        expect(isPlayerPreference(null)).toBe(false)
    })
})
