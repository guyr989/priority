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
    render(<Results status="idle" tracks={[]} onSelect={noop} onRetry={noop} />)

    expect(screen.getByText(/search for a track/i)).toBeInTheDocument()
  })

  it('says it is searching while loading', () => {
    render(<Results status="loading" tracks={[]} onSelect={noop} onRetry={noop} />)

    expect(screen.getByText(/searching/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('explains an empty result instead of showing a blank list', () => {
    render(<Results status="ready" tracks={[]} onSelect={noop} onRetry={noop} />)

    expect(screen.getByText(/no tracks match/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('announces a failure and offers a retry', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<Results status="error" tracks={[]} onSelect={noop} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/did not go through/i)

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('lists tracks and reports which one was chosen', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Results
        status="ready"
        tracks={[track('one'), track('two')]}
        onSelect={onSelect}
        onRetry={noop}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'two' }))

    expect(onSelect).toHaveBeenCalledWith(track('two'), expect.any(HTMLButtonElement))
  })
})
