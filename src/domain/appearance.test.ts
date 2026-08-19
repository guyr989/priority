import { describe, expect, it } from "vitest"
import {
    APPEARANCES,
    DEFAULT_APPEARANCE,
    findAppearance,
    isAppearanceId,
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
