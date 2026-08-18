import { describe, expect, it } from 'vitest'
import { addSearch, HISTORY_LIMIT, isHistory } from './history'

describe('search history', () => {
    it('puts a new term at the top', () => {
        expect(addSearch(['jazz'], 'adele')).toEqual(['adele', 'jazz'])
    })

    it('moves a repeated term back to the top instead of duplicating it', () => {
        expect(addSearch(['jazz', 'adele', 'pixies'], 'adele')).toEqual([
            'adele',
            'jazz',
            'pixies',
        ])
    })

    it('treats terms that differ only by case as the same entry', () => {
        expect(addSearch(['adele'], 'ADELE')).toEqual(['ADELE'])
    })

    it('keeps at most five terms', () => {
        const full = ['e', 'd', 'c', 'b', 'a']
        const result = addSearch(full, 'f')

        expect(result).toHaveLength(HISTORY_LIMIT)
        expect(result[0]).toBe('f')
        expect(result).not.toContain('a')
    })

    it('ignores blank terms', () => {
        expect(addSearch(['adele'], '   ')).toEqual(['adele'])
    })

    it('trims surrounding whitespace', () => {
        expect(addSearch([], '  adele  ')).toEqual(['adele'])
    })

    it('replaces the top entry when the new term continues it', () => {
        expect(addSearch(['ade', 'jazz'], 'adele')).toEqual(['adele', 'jazz'])
    })

    it('keeps an older term that the new one happens to extend', () => {
        expect(addSearch(['jazz', 'ade'], 'adele')).toEqual(['adele', 'jazz', 'ade'])
    })

    it('never mutates the history it is given', () => {
        const original = ['jazz']
        addSearch(original, 'adele')

        expect(original).toEqual(['jazz'])
    })

    it('recognises a stored value that is a list of strings', () => {
        expect(isHistory(['a', 'b'])).toBe(true)
        expect(isHistory([])).toBe(true)
        expect(isHistory(['a', 3])).toBe(false)
        expect(isHistory('adele')).toBe(false)
        expect(isHistory(null)).toBe(false)
    })
})
