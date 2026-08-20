import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RecentSearches } from './RecentSearches'

describe('RecentSearches', () => {
  it('takes up no room at all while the list is empty', () => {
    const { container } = render(<RecentSearches terms={[]} onSelect={vi.fn()} onForget={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('lists the terms newest first', () => {
    render(<RecentSearches terms={['adele', 'pixies']} onSelect={vi.fn()} onForget={vi.fn()} />)

    const items = screen.getAllByRole('button', { name: /^(adele|pixies)$/ })

    expect(items.map((item) => item.textContent)).toEqual(['adele', 'pixies'])
  })

  it('starts a new search when a term is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<RecentSearches terms={['adele']} onSelect={onSelect} onForget={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'adele' }))

    expect(onSelect).toHaveBeenCalledWith('adele')
  })

  it('reaches every term with the keyboard', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<RecentSearches terms={['adele', 'pixies']} onSelect={onSelect} onForget={vi.fn()} />)

    // Two stops per chip now: the term, then the cross that forgets it.
    await user.tab()
    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('pixies')
  })

  it('forgets a single term without touching the rest', async () => {
    const onForget = vi.fn()
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<RecentSearches terms={['adele', 'pixies']} onSelect={onSelect} onForget={onForget} />)

    await user.click(screen.getByRole('button', { name: /remove adele from history/i }))

    expect(onForget).toHaveBeenCalledWith('adele')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
