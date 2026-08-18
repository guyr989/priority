import { afterEach, describe, expect, it, vi } from 'vitest'
import { isHistory } from '../domain/history'
import { createLocalStore } from './localStore'

const KEY = 'priority.test'

afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
})

describe('local store', () => {
    it('reads back what it wrote', () => {
        const store = createLocalStore(KEY, isHistory)
        store.write(['adele', 'pixies'])

        expect(store.read()).toEqual(['adele', 'pixies'])
    })

    it('returns null when nothing was stored', () => {
        expect(createLocalStore(KEY, isHistory).read()).toBeNull()
    })

    it('returns null when the stored value is not valid JSON', () => {
        window.localStorage.setItem(KEY, '{not json')

        expect(createLocalStore(KEY, isHistory).read()).toBeNull()
    })

    it('returns null when the stored value has the wrong shape', () => {
        window.localStorage.setItem(KEY, JSON.stringify([1, 2, 3]))

        expect(createLocalStore(KEY, isHistory).read()).toBeNull()
    })

    it('survives a storage that refuses to write', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota exceeded')
        })

        expect(() => createLocalStore(KEY, isHistory).write(['adele'])).not.toThrow()
    })

    it('survives a storage that refuses to read', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('access denied')
        })

        expect(createLocalStore(KEY, isHistory).read()).toBeNull()
    })
})
