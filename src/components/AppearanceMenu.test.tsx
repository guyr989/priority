import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { APPEARANCES, DEFAULT_APPEARANCE } from '../domain/appearance'
import { AppearanceMenu } from './AppearanceMenu'

function renderMenu() {
  const onChoose = vi.fn()
  render(
    <AppearanceMenu looks={APPEARANCES} current={DEFAULT_APPEARANCE} onChoose={onChoose} />,
  )
  return { user: userEvent.setup(), onChoose }
}

describe('AppearanceMenu', () => {
  it('names the icon-only button for anyone who cannot see it', () => {
    renderMenu()

    expect(screen.getByRole('button', { name: 'Appearance' })).toBeInTheDocument()
  })

  it('keeps the looks out of reach until it is opened', async () => {
    const { user } = renderMenu()

    expect(screen.queryByRole('radio', { name: /studio/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Appearance' }))

    expect(screen.getByRole('radio', { name: /studio/i })).toBeChecked()
  })

  it('offers every look the app knows about', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Appearance' }))

    expect(screen.getAllByRole('radio')).toHaveLength(APPEARANCES.length)
  })

  it('reports the chosen look and stays open so looks can be compared', async () => {
    const { user, onChoose } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Appearance' }))
    await user.click(screen.getByRole('radio', { name: /^riso/i }))

    expect(onChoose).toHaveBeenCalledWith('riso')
    expect(screen.getByRole('radio', { name: /^riso/i })).toBeVisible()
  })

  it('closes on Escape and hands focus back', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Appearance' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('radio', { name: /studio/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Appearance' })).toHaveFocus()
  })
})
