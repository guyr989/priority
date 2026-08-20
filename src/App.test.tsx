import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Page } from './domain/page'
import type { SoundProvider } from './domain/soundProvider'
import type { Track } from './domain/track'
import type { LayoutId, PaletteId } from './domain/appearance'
import type { PlaybackSource } from './domain/playback'
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

function createPlayer() {
  let report: ((playing: boolean) => void) | null = null
  const source: PlaybackSource = {
    isPlaying: true,
    subscribe(onChange) {
      report = onChange
      return () => {
        report = null
      }
    },
  }
  return {
    attach: () => Promise.resolve(source),
    say: (playing: boolean) => act(() => report?.(playing)),
    attached: () => waitFor(() => expect(report).not.toBeNull()),
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
  const paletteStore = createMemoryStore<PaletteId>(null)
  const layoutStore = createMemoryStore<LayoutId>(null)
  const playerStore = createMemoryStore<boolean>(null)
  const player = createPlayer()
  render(
    <App
      provider={createProvider(pages)}
      historyStore={store}
      viewStore={viewStore}
      lastTrackStore={lastTrackStore}
      paletteStore={paletteStore}
      layoutStore={layoutStore}
      playerStore={playerStore}
      attachPlayback={player.attach}
      debounceMs={0}
    />,
  )
  return {
    user: userEvent.setup(),
    store,
    viewStore,
    lastTrackStore,
    paletteStore,
    layoutStore,
    playerStore,
    player,
  }
}

/** The player switch lives behind the gear, so reaching it is two clicks. */
async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Settings' }))
  await user.click(screen.getByRole('switch', { name: 'Player' }))
  await user.keyboard('{Escape}')
}

function playerSwitch() {
  return screen.getByRole('switch', { name: 'Player' })
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia')
  Reflect.deleteProperty(document.documentElement.dataset, 'palette')
})

/** Only the one-column layout offers to fold the list, so tests that exercise
 *  the fold have to say they are on a phone. */
function askForANarrowWindow() {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: query.includes('max-width'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    configurable: true,
    writable: true,
  })
}

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

    const recent = screen.getByRole('region', { name: /history/i })
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

    const recent = screen.getByRole('region', { name: /history/i })
    await user.click(within(recent).getByRole('button', { name: 'pixies' }))

    expect(screen.getByRole('searchbox', { name: /search tracks/i })).toHaveValue('pixies')
    expect(await screen.findByRole('button', { name: 'first result' })).toBeInTheDocument()
  })

  it('embeds the player when the artwork is clicked', async () => {
    const { user } = renderApp([pageOf(['first result', 'second result'], null)])

    await openSettings(user)

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    expect(screen.queryByTitle('Player for first result')).not.toBeInTheDocument()

    await user.click(screen.getByRole('img', { name: /first result by artist/i }))

    const player = screen.getByTitle('Player for first result')
    expect(player).toHaveAttribute('src', 'https://player.test/?feed=first result')
    expect(player).toHaveAttribute('allow', 'autoplay; encrypted-media')

    await user.click(screen.getByRole('button', { name: 'second result' }))

    expect(screen.queryByTitle('Player for first result')).not.toBeInTheDocument()
  })

  it('takes the results off the page once a track is picked, and a new search brings them back', async () => {
    askForANarrowWindow()
    const { user } = renderApp([pageOf(['first result', 'second result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    // The whole board leaves, not just the list: no results, and no page turns
    // left behind to act on a list that is not there.
    expect(screen.queryByRole('button', { name: 'second result' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Result pages' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'x')

    expect(await screen.findByRole('group', { name: 'Result pages' })).toBeInTheDocument()
  })

  it('brings the results back when a recent term is picked', async () => {
    askForANarrowWindow()
    const { user } = renderApp([pageOf(['first result', 'second result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    expect(screen.queryByRole('group', { name: 'Result pages' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'adele' }))

    expect(await screen.findByRole('group', { name: 'Result pages' })).toBeInTheDocument()
  })

  it('keeps the board off the page until a search has something to say', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    // Nothing typed: no board, and so no empty box to look at.
    expect(screen.queryByRole('group', { name: 'Result pages' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')

    expect(await screen.findByRole('button', { name: 'first result' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Result pages' })).toBeInTheDocument()
  })

  it('still shows the board when a search found nothing', async () => {
    const { user } = renderApp([pageOf([], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')

    // Requirement 8: empty is a state with something to say, not a blank page.
    expect(await screen.findByText(/nothing under that name/i)).toBeInTheDocument()
  })

  it('keeps the results on a window with room for them', async () => {
    const { user } = renderApp([pageOf(['first result', 'second result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    expect(screen.getByRole('button', { name: 'second result' })).toBeVisible()
    expect(screen.getByRole('group', { name: 'Result pages' })).toBeInTheDocument()
  })

  it('remembers the layout the user picked', async () => {
    const { user, viewStore } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await screen.findByRole('button', { name: 'first result' })

    // One control: it offers Grid while the list is showing, and once it has
    // been taken it offers the way back.
    await user.click(screen.getByRole('button', { name: 'Grid' }))

    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(viewStore.read()).toBe('tile')
  })

  it('opens in the layout stored from the last visit', async () => {
    const { user } = renderApp([pageOf(['first result'], null)], [], 'tile')

    // The toggle rides with the board, and the board waits for a search.
    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await screen.findByRole('button', { name: 'first result' })

    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('moves focus to the image container when a result is chosen', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    expect(screen.getByRole('region', { name: /selected track/i })).toHaveFocus()
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

    const image = screen.getByRole('region', { name: /selected track/i })
    expect(within(image).getByRole('img', { name: /first result by artist/i })).toBeInTheDocument()
    expect(image).toHaveFocus()
  })

  it('captions the artwork with the title, the artist, and how to play it', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await openSettings(user)

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    const image = screen.getByRole('region', { name: /selected track/i })
    expect(within(image).getByText('first result')).toBeInTheDocument()
    expect(within(image).getByText('artist')).toBeInTheDocument()
    expect(
      within(image).getByRole('button', { name: 'Play first result by artist' }),
    ).toBeInTheDocument()

    await user.click(within(image).getByRole('img', { name: /first result by artist/i }))

    expect(
      within(image).queryByRole('button', { name: /^play /i }),
    ).not.toBeInTheDocument()

    // The transport lives in the bar at the foot of the window, not the sleeve.
    const bar = screen.getByRole('complementary', { name: 'Player' })
    expect(within(bar).getByTitle('Player for first result')).toBeInTheDocument()
    expect(within(image).queryByTitle('Player for first result')).not.toBeInTheDocument()
  })

  it('keeps the embed when the listener pauses on the player itself', async () => {
    const { user, player } = renderApp([pageOf(['first result'], null)])

    await openSettings(user)

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))
    await user.click(screen.getByRole('img', { name: /first result by artist/i }))

    await player.attached()
    player.say(false)

    expect(screen.getByTitle('Player for first result')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^play /i }),
    ).not.toBeInTheDocument()
  })

  it('changes the colour and keeps it for the next visit', async () => {
    const { user, paletteStore } = renderApp([pageOf(['first result'], null)])

    expect(document.documentElement.dataset.palette).toBe('cinema')

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: /^desk/i }))

    expect(document.documentElement.dataset.palette).toBe('desk')
    expect(paletteStore.read()).toBe('desk')
  })

  it('changes the layout without touching the colour', async () => {
    const { user, paletteStore, layoutStore } = renderApp([pageOf(['first result'], null)])

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: /^desk/i }))
    await user.click(screen.getByRole('radio', { name: /^stacked/i }))

    expect(layoutStore.read()).toBe('stack')
    expect(paletteStore.read()).toBe('desk')
    expect(document.documentElement.dataset.palette).toBe('desk')
  })

  it('shows the sleeve as artwork while the player is switched off', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    const image = screen.getByRole('region', { name: /selected track/i })
    expect(within(image).getByRole('img', { name: /first result by artist/i })).toBeInTheDocument()
    expect(within(image).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Player for first result')).not.toBeInTheDocument()
  })

  it('starts with no player until the visitor asks for one', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    const image = screen.getByRole('region', { name: /selected track/i })

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(playerSwitch()).not.toBeChecked()
    await user.keyboard('{Escape}')
    expect(within(image).queryByRole('button')).not.toBeInTheDocument()

    await openSettings(user)

    expect(
      within(image).getByRole('button', { name: 'Play first result by artist' }),
    ).toBeInTheDocument()
  })

  it('keeps the one answer for every look, and for the next visit', async () => {
    const { user, playerStore } = renderApp([pageOf(['first result'], null)])

    await openSettings(user)
    expect(playerStore.read()).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: /^cinema/i }))

    expect(playerSwitch()).toBeChecked()
  })

  it('drops the player when the switch goes off, and remembers that', async () => {
    const { user, playerStore } = renderApp([pageOf(['first result'], null)])

    await openSettings(user)
    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))
    await user.click(screen.getByRole('img', { name: /first result by artist/i }))

    expect(screen.getByTitle('Player for first result')).toBeInTheDocument()

    await openSettings(user)

    expect(screen.queryByTitle('Player for first result')).not.toBeInTheDocument()
    expect(playerStore.read()).toBe(false)
  })

  it('keeps no now playing panel until something has been picked', () => {
    renderApp([pageOf(['first result'], null)])

    expect(
      screen.queryByRole('region', { name: /selected track/i }),
    ).not.toBeInTheDocument()
  })

  it('opens on the cover it was left on and does not grab focus for it', () => {
    renderApp([pageOf(['first result'], null)], [], null, track('kept from last time'))

    const image = screen.getByRole('region', { name: /selected track/i })
    expect(
      within(image).getByRole('img', { name: /kept from last time by artist/i }),
    ).toBeInTheDocument()
    expect(image).not.toHaveFocus()
    expect(screen.queryByTitle('Player for kept from last time')).not.toBeInTheDocument()
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

    const image = screen.getByRole('region', { name: /selected track/i })
    expect(within(image).getByRole('img', { name: /first result by artist/i })).toBeInTheDocument()
  })
})
