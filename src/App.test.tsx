import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Page } from './domain/page'
import type { SoundProvider } from './domain/soundProvider'
import type { Track } from './domain/track'
import type { Store } from './storage/store'
import type { ViewMode } from './domain/view'

function track(title: string): Track {
  return {
    id: title,
    title,
    artist: 'artist',
    imageUrl: '/image.jpg',
    embedUrl: `https://player.test/?feed=${title}`,
  }
}

function pageOf(titles: readonly string[], nextCursor: string | null): Page<Track> {
  return { items: titles.map(track), nextCursor, prevCursor: null }
}

function createProvider(pages: readonly Page<Track>[]): SoundProvider {
  return {
    search: (_query, cursor) =>
      Promise.resolve(cursor === null ? pages[0]! : pages[1]!),
  }
}

function createMemoryStore<T>(initial: T | null): Store<T> {
  let value = initial
  return {
    read: () => value,
    write: (next) => {
      value = next
    },
  }
}

function renderApp(
  pages: readonly Page<Track>[],
  history: readonly string[] = [],
  view: ViewMode | null = null,
  lastTrack: Track | null = null,
) {
  const store = createMemoryStore<readonly string[]>(history)
  const viewStore = createMemoryStore<ViewMode>(view)
  const lastTrackStore = createMemoryStore<Track>(lastTrack)
  render(
    <App
      provider={createProvider(pages)}
      historyStore={store}
      viewStore={viewStore}
      lastTrackStore={lastTrackStore}
      debounceMs={0}
    />,
  )
  return { user: userEvent.setup(), store, viewStore, lastTrackStore }
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia')
})

function askForReducedMotion() {
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    configurable: true,
    writable: true,
  })
}

describe('App', () => {
  it('searches, remembers the term, and pages with the cursor', async () => {
    const { user, store } = renderApp([
      pageOf(['first result'], 'cursor-2'),
      pageOf(['second page result'], null),
    ])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')

    expect(await screen.findByRole('button', { name: 'first result' })).toBeInTheDocument()

    const recent = screen.getByRole('region', { name: /recent searches/i })
    await waitFor(() => {
      expect(within(recent).getByRole('button', { name: 'adele' })).toBeInTheDocument()
    })
    expect(store.read()).toEqual(['adele'])

    const next = screen.getByRole('button', { name: 'Next' })
    expect(next).toBeEnabled()

    await user.click(next)

    expect(
      await screen.findByRole('button', { name: 'second page result' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('starts a search when a recent term is clicked', async () => {
    const { user } = renderApp([pageOf(['first result'], null)], ['pixies'])

    const recent = screen.getByRole('region', { name: /recent searches/i })
    await user.click(within(recent).getByRole('button', { name: 'pixies' }))

    expect(screen.getByRole('searchbox', { name: /search tracks/i })).toHaveValue('pixies')
    expect(await screen.findByRole('button', { name: 'first result' })).toBeInTheDocument()
  })

  it('embeds the player when the artwork is clicked', async () => {
    const { user } = renderApp([pageOf(['first result', 'second result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    expect(screen.queryByTitle('first result player')).not.toBeInTheDocument()

    await user.click(screen.getByRole('img', { name: /first result by artist/i }))

    const player = screen.getByTitle('first result player')
    expect(player).toHaveAttribute('src', 'https://player.test/?feed=first result')
    expect(player).toHaveAttribute('allow', 'autoplay; encrypted-media')

    await user.click(screen.getByRole('button', { name: 'second result' }))

    expect(screen.queryByTitle('first result player')).not.toBeInTheDocument()
  })

  it('remembers the layout the user picked', async () => {
    const { user, viewStore } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await screen.findByRole('button', { name: 'first result' })

    await user.click(screen.getByRole('button', { name: 'Tile' }))

    expect(screen.getByRole('button', { name: 'Tile' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(viewStore.read()).toBe('tile')
  })

  it('opens in the layout stored from the last visit', async () => {
    renderApp([pageOf(['first result'], null)], [], 'tile')

    expect(screen.getByRole('button', { name: 'Tile' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('moves focus to the image container when a result is chosen', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    expect(screen.getByRole('region', { name: /now playing/i })).toHaveFocus()
  })

  it('announces what the search did', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    expect(screen.getByRole('status')).toHaveTextContent('')

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await screen.findByRole('button', { name: 'first result' })

    expect(screen.getByRole('status')).toHaveTextContent('1 result ready')
  })

  it('skips the flight for readers who ask for reduced motion', async () => {
    askForReducedMotion()
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    const image = screen.getByRole('region', { name: /now playing/i })
    expect(within(image).getByRole('img', { name: /first result by artist/i })).toBeInTheDocument()
    expect(image).toHaveFocus()
  })

  it('captions the artwork with the title, the artist, and how to play it', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    const image = screen.getByRole('region', { name: /now playing/i })
    expect(within(image).getByText('first result')).toBeInTheDocument()
    expect(within(image).getByText('artist')).toBeInTheDocument()
    expect(
      within(image).getByRole('button', { name: 'Play first result by artist' }),
    ).toBeInTheDocument()

    await user.click(within(image).getByRole('img', { name: /first result by artist/i }))

    expect(
      within(image).queryByRole('button', { name: /^play /i }),
    ).not.toBeInTheDocument()
    expect(within(image).getByTitle('first result player')).toBeInTheDocument()
  })

  it('keeps no now playing panel until something has been picked', () => {
    renderApp([pageOf(['first result'], null)])

    expect(
      screen.queryByRole('region', { name: /now playing/i }),
    ).not.toBeInTheDocument()
  })

  it('opens on the cover it was left on and does not grab focus for it', () => {
    renderApp([pageOf(['first result'], null)], [], null, track('kept from last time'))

    const image = screen.getByRole('region', { name: /now playing/i })
    expect(
      within(image).getByRole('img', { name: /kept from last time by artist/i }),
    ).toBeInTheDocument()
    expect(image).not.toHaveFocus()
    expect(screen.queryByTitle('kept from last time player')).not.toBeInTheDocument()
  })

  it('remembers the cover it showed for the next visit', async () => {
    const { user, lastTrackStore } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    expect(lastTrackStore.read()).toEqual(track('first result'))
  })

  it('shows the selected track in the image container', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    const image = screen.getByRole('region', { name: /now playing/i })
    expect(within(image).getByRole('img', { name: /first result by artist/i })).toBeInTheDocument()
  })
})
