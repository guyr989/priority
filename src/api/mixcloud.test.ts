import { afterEach, describe, expect, it, vi } from 'vitest'
import { soundProvider } from './mixcloud'

function respondWith(body: unknown, ok = true) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        json: () => Promise.resolve(body),
    } as Response)
}

function requestedUrl(fetchSpy: ReturnType<typeof respondWith>): string {
    return String(fetchSpy.mock.calls[0]?.[0])
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('mixcloud provider', () => {
    it('maps the response to domain tracks', async () => {
        respondWith({
            data: [
                {
                    key: '/artist/set/',
                    name: 'A set',
                    user: { name: 'An artist' },
                    pictures: { large: 'https://example.test/large.jpg' },
                },
            ],
            paging: { next: 'https://api.mixcloud.com/search/?offset=6' },
        })

        const page = await soundProvider.search('adele', null, new AbortController().signal)

        expect(page.items).toEqual([
            {
                id: '/artist/set/',
                title: 'A set',
                artist: 'An artist',
                imageUrl: 'https://example.test/large.jpg',
                embedUrl:
                    'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=1&autoplay=1&feed=%2Fartist%2Fset%2F',
            },
        ])
        expect(page.nextCursor).toBe('https://api.mixcloud.com/search/?offset=6')
        expect(page.prevCursor).toBeNull()
    })

    it('drops entries that are missing the fields a track needs', async () => {
        respondWith({ data: [{ name: 'no key' }, { key: '/k/', name: 'kept' }] })

        const page = await soundProvider.search('adele', null, new AbortController().signal)

        expect(page.items.map((item) => item.title)).toEqual(['kept'])
    })

    it('follows a cursor from the API', async () => {
        const fetchSpy = respondWith({ data: [] })

        await soundProvider.search(
            'adele',
            'https://api.mixcloud.com/search/?offset=6',
            new AbortController().signal,
        )

        expect(requestedUrl(fetchSpy)).toBe('https://api.mixcloud.com/search/?offset=6')
    })

    it('refuses a cursor pointing at another host', async () => {
        respondWith({ data: [] })

        await expect(
            soundProvider.search('adele', 'https://attacker.test/collect', new AbortController().signal),
        ).rejects.toThrow(/another host/i)
    })

    it('fails loudly when the API returns an error status', async () => {
        respondWith({}, false)

        await expect(
            soundProvider.search('adele', null, new AbortController().signal),
        ).rejects.toThrow(/500/)
    })
})
