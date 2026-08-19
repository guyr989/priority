import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Track } from '../domain/track'
import { Results } from './Results'

function track(title: string): Track {
  return { id: title, title, artist: 'artist', imageUrl: '', embedUrl: '' }
}

const noop = () => {}

describe('Results', () => {
  it('invites a first search while idle', () => {
    render(<Results status="idle" view="list" showingId={null} tracks={[]} onSelect={noop} onRetry={noop} />)

    expect(screen.getByText(/start digging/i)).toBeInTheDocument()
  })

  it('says it is searching while loading', () => {
    render(<Results status="loading" view="list" showingId={null} tracks={[]} onSelect={noop} onRetry={noop} />)

    expect(screen.getByText('Digging')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Searching')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('holds the page it has while the next one loads', () => {
    render(
      <Results
        status="loading"
        view="list"
        showingId={null}
        tracks={[track('one'), track('two')]}
        onSelect={noop}
        onRetry={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'one' })).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Digging')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Searching')
  })

  it('drops the busy mark once the page has landed', () => {
    render(
      <Results
        status="ready"
        view="list"
        showingId={null}
        tracks={[track('one')]}
        onSelect={noop}
        onRetry={noop}
      />,
    )

    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'false')
  })

  it('explains an empty result instead of showing a blank list', () => {
    render(<Results status="ready" view="list" showingId={null} tracks={[]} onSelect={noop} onRetry={noop} />)

    expect(screen.getByText(/try a shorter one/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/nothing found/i)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('announces a failure and offers a retry', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<Results status="error" view="list" showingId={null} tracks={[]} onSelect={noop} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/did not land/i)

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('marks the track that is on the sleeve', () => {
    render(
      <Results
        status="ready"
        view="list"
        showingId="two"
        tracks={[track('one'), track('two')]}
        onSelect={noop}
        onRetry={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'two' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-current', 'false')
  })

  it('tiles the same tracks with their artwork', () => {
    render(
      <Results
        status="ready"
        view="tile"
        showingId={null}
        tracks={[track('one'), track('two')]}
        onSelect={noop}
        onRetry={noop}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'one' })).toBeInTheDocument()
  })

  it('lists tracks and reports which one was chosen', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Results
        status="ready"
        view="list"
        showingId={null}
        tracks={[track('one'), track('two')]}
        onSelect={onSelect}
        onRetry={noop}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('2 results ready')

    await user.click(screen.getByRole('button', { name: 'two' }))

    expect(onSelect).toHaveBeenCalledWith(track('two'), expect.any(HTMLButtonElement))
  })
})
