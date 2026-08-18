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
        expect(DEFAULT_APPEARANCE).toBe(APPEARANCES[0])
    })

    it("says so when a look drops the player", () => {
        const quiet = APPEARANCES.filter((look) => !look.showsPlayer)

        expect(quiet.length).toBeGreaterThan(0)
        quiet.forEach((look) => expect(look.note).toMatch(/no player/i))
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
