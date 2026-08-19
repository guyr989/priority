import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_LAYOUT, DEFAULT_PALETTE, LAYOUTS, PALETTES } from '../domain/appearance'
import { SettingsMenu } from './SettingsMenu'

function renderMenu(playerOn = false) {
  const onChoosePalette = vi.fn()
  const onChooseLayout = vi.fn()
  const onChoosePlayer = vi.fn()
  render(
    <SettingsMenu
      palettes={PALETTES}
      palette={DEFAULT_PALETTE}
      layouts={LAYOUTS}
      layout={DEFAULT_LAYOUT}
      playerOn={playerOn}
      onChoosePalette={onChoosePalette}
      onChooseLayout={onChooseLayout}
      onChoosePlayer={onChoosePlayer}
    />,
  )
  return { user: userEvent.setup(), onChoosePalette, onChooseLayout, onChoosePlayer }
}

describe('SettingsMenu', () => {
  it('names the icon-only button for anyone who cannot see it', () => {
    renderMenu()

    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('keeps the settings out of reach until it is opened', async () => {
    const { user } = renderMenu()

    expect(screen.queryByRole('radio', { name: /studio/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByRole('radio', { name: /studio/i })).toBeChecked()
  })

  it('offers colour and layout as two separate choices', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(2)
    expect(screen.getByRole('group', { name: 'Colour' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Layout' })).toBeInTheDocument()
  })

  it('reports a colour without touching the layout', async () => {
    const { user, onChoosePalette, onChooseLayout } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: /^cinema/i }))

    expect(onChoosePalette).toHaveBeenCalledWith('cinema')
    expect(onChooseLayout).not.toHaveBeenCalled()
  })

  it('reports a layout without touching the colour', async () => {
    const { user, onChoosePalette, onChooseLayout } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: /^row/i }))

    expect(onChooseLayout).toHaveBeenCalledWith('row')
    expect(onChoosePalette).not.toHaveBeenCalled()
  })

  it('carries the player answer on one switch', async () => {
    const { user, onChoosePlayer } = renderMenu(true)

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByRole('switch', { name: 'Player' })).toBeChecked()

    await user.click(screen.getByRole('switch', { name: 'Player' }))

    expect(onChoosePlayer).toHaveBeenCalledWith(false)
  })

  it('closes on Escape and hands focus back', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('radio', { name: /studio/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus()
  })
})
