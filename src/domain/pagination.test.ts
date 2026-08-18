import { describe, expect, it } from 'vitest'
import type { Page } from './page'
import {
    canGoNext,
    canGoPrev,
    goNext,
    goPrev,
    initialPagination,
    receivePage,
} from './pagination'

const page = (next: string | null, prev: string | null): Page<string> => ({
    items: [],
    nextCursor: next,
    prevCursor: prev,
})

describe('pagination', () => {
    it('starts on the first page with nowhere to go', () => {
        expect(initialPagination.cursor).toBeNull()
        expect(canGoNext(initialPagination)).toBe(false)
        expect(canGoPrev(initialPagination)).toBe(false)
    })

    it('opens Next once a page reports a next cursor', () => {
        const state = receivePage(initialPagination, page('c2', null))
        expect(canGoNext(state)).toBe(true)
        expect(canGoPrev(state)).toBe(false)
    })

    it('moves the current cursor forward', () => {
        const state = goNext(receivePage(initialPagination, page('c2', null)))
        expect(state.cursor).toBe('c2')
    })

    it('disables both buttons until the next page arrives', () => {
        const state = goNext(receivePage(initialPagination, page('c2', 'c0')))
        expect(canGoNext(state)).toBe(false)
        expect(canGoPrev(state)).toBe(false)
    })

    it('ignores Next at the end of the results', () => {
        const end = receivePage(initialPagination, page(null, 'c1'))
        expect(goNext(end)).toBe(end)
    })

    it('ignores Prev on the first page', () => {
        expect(goPrev(initialPagination)).toBe(initialPagination)
    })

    it('goes back to the cursor the page reported', () => {
        const second = receivePage({ ...initialPagination, cursor: 'c2' }, page('c3', 'c1'))
        expect(goPrev(second).cursor).toBe('c1')
    })

    it('never invents a cursor: two pages forward keeps only what the API gave', () => {
        const first = receivePage(initialPagination, page('c2', null))
        const second = receivePage(goNext(first), page('c3', 'c1'))
        expect(second.cursor).toBe('c2')
        expect(second.nextCursor).toBe('c3')
        expect(second.prevCursor).toBe('c1')
    })

    it('keeps the cursor that produced the page it is given', () => {
        const deep = receivePage({ cursor: 'c9', nextCursor: null, prevCursor: null }, page('c10', 'c8'))
        expect(deep.cursor).toBe('c9')
        expect(deep.nextCursor).toBe('c10')
    })
})
