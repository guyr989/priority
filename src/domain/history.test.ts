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
        expect(addSearch(['jazz', 'adele'], 'ADELE')).toEqual(['ADELE', 'jazz'])
    })

    it('keeps at most five terms', () => {
        const full = ['e', 'd', 'c', 'b', 'a']
        const result = addSearch(full, 'f')

        expect(result).toHaveLength(HISTORY_LIMIT)
        expect(result[0]).toBe('f')
        expect(result).not.toContain('a')
    })

    it('returns the same list when the term is already on top', () => {
        const history = ['adele', 'jazz']

        expect(addSearch(history, 'adele')).toBe(history)
        expect(addSearch(history, 'ADELE')).toBe(history)
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
