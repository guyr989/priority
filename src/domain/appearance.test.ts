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

    it("starts every visitor on the same known look", () => {
        expect(APPEARANCES[0]).toBe(DEFAULT_APPEARANCE)
    })

    it("keeps the cover backdrop to the looks built around one", () => {
        const dressed = APPEARANCES.filter((look) => look.coverBackdrop)

        expect(dressed.map((look) => look.id)).toEqual(["cinema", "poster"])
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
