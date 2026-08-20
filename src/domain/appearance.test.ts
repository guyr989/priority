import { describe, expect, it } from "vitest"
import {
    DEFAULT_LAYOUT,
    DEFAULT_PALETTE,
    findLayout,
    findPalette,
    isLayoutId,
    isPaletteId,
    LAYOUTS,
    PALETTES,
} from "./appearance"

describe("palette", () => {
    it("keeps the ids unique", () => {
        const ids = PALETTES.map((palette) => palette.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("starts every visitor on the same known palette", () => {
        expect(PALETTES).toContain(DEFAULT_PALETTE)
    })

    it("keeps the cover backdrop to the palette built around one", () => {
        const dressed = PALETTES.filter((palette) => palette.coverBackdrop)

        expect(dressed.map((palette) => palette.id)).toEqual(["cinema"])
    })

    it("only accepts an id it knows", () => {
        expect(isPaletteId("desk")).toBe(true)
        expect(isPaletteId("riso")).toBe(false)
        expect(isPaletteId(7)).toBe(false)
        expect(isPaletteId(null)).toBe(false)
    })

    it("falls back to the default rather than breaking on a retired id", () => {
        expect(findPalette("cinema").id).toBe("cinema")
        expect(findPalette("gallery")).toBe(DEFAULT_PALETTE)
        expect(findPalette(undefined)).toBe(DEFAULT_PALETTE)
    })
})

describe("layout", () => {
    it("is chosen apart from the palette, so any pair is reachable", () => {
        for (const palette of PALETTES) {
            for (const layout of LAYOUTS) {
                expect(findPalette(palette.id).id).toBe(palette.id)
                expect(findLayout(layout)).toBe(layout)
            }
        }
    })

    it("falls back to the default rather than breaking on a stale id", () => {
        expect(findLayout("row")).toBe("row")
        expect(findLayout("carousel")).toBe(DEFAULT_LAYOUT)
        expect(findLayout(null)).toBe(DEFAULT_LAYOUT)
    })

    it("only accepts a layout it knows", () => {
        expect(isLayoutId("banner")).toBe(true)
        expect(isLayoutId("beside")).toBe(false)
    })
})
