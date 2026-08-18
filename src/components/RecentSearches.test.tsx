import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RecentSearches } from './RecentSearches'

describe('RecentSearches', () => {
  it('tells the user what the panel is for while it is empty', () => {
    render(<RecentSearches terms={[]} onSelect={vi.fn()} />)

    expect(screen.getByText(/show up here/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('lists the terms newest first', () => {
    render(<RecentSearches terms={['adele', 'pixies']} onSelect={vi.fn()} />)

    const items = screen.getAllByRole('button')

    expect(items.map((item) => item.textContent)).toEqual(['adele', 'pixies'])
  })

  it('starts a new search when a term is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<RecentSearches terms={['adele']} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: 'adele' }))

    expect(onSelect).toHaveBeenCalledWith('adele')
  })

  it('reaches every term with the keyboard', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<RecentSearches terms={['adele', 'pixies']} onSelect={onSelect} />)

    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('pixies')
  })
})
