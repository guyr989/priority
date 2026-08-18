import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { Page } from './domain/page'
import type { SoundProvider } from './domain/soundProvider'
import type { Track } from './domain/track'
import type { Store } from './storage/store'

function track(title: string): Track {
  return { id: title, title, artist: 'artist', imageUrl: '/image.jpg', embedUrl: '' }
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

function createMemoryStore(initial: readonly string[]): Store<readonly string[]> {
  let value = initial
  return {
    read: () => value,
    write: (next) => {
      value = next
    },
  }
}

function renderApp(pages: readonly Page<Track>[], history: readonly string[] = []) {
  const store = createMemoryStore(history)
  render(<App provider={createProvider(pages)} historyStore={store} />)
  return { user: userEvent.setup(), store }
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

  it('shows the selected track in the image container', async () => {
    const { user } = renderApp([pageOf(['first result'], null)])

    await user.type(screen.getByRole('searchbox', { name: /search tracks/i }), 'adele')
    await user.click(await screen.findByRole('button', { name: 'first result' }))

    const image = screen.getByRole('region', { name: /now showing/i })
    expect(within(image).getByRole('img', { name: /first result by artist/i })).toBeInTheDocument()
  })
})
