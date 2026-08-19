import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { APPEARANCES, DEFAULT_APPEARANCE, NO_PLAYER_PREFERENCE } from '../domain/appearance'
import type { PlayerPreference } from '../domain/appearance'
import { AppearanceMenu } from './AppearanceMenu'

function renderMenu(players: PlayerPreference = NO_PLAYER_PREFERENCE) {
  const onChoose = vi.fn()
  const onChoosePlayer = vi.fn()
  render(
    <AppearanceMenu
      looks={APPEARANCES}
      current={DEFAULT_APPEARANCE}
      players={players}
      onChoose={onChoose}
      onChoosePlayer={onChoosePlayer}
    />,
  )
  return { user: userEvent.setup(), onChoose, onChoosePlayer }
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

  it('shows every look already carrying a player, except the one that ships quiet', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Appearance' }))

    expect(screen.getByRole('switch', { name: 'Player in Studio' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Player in Gallery' })).not.toBeChecked()
  })

  it('reports the look and the new answer when a switch is pressed', async () => {
    const { user, onChoose, onChoosePlayer } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Appearance' }))
    await user.click(screen.getByRole('switch', { name: 'Player in Studio' }))

    expect(onChoosePlayer).toHaveBeenCalledWith('studio', false)
    expect(onChoose).not.toHaveBeenCalled()
  })

  it('draws a stored answer rather than the default the look ships with', async () => {
    const { user } = renderMenu({ gallery: true, 'after-hours': false })

    await user.click(screen.getByRole('button', { name: 'Appearance' }))

    expect(screen.getByRole('switch', { name: 'Player in Gallery' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Player in After hours' })).not.toBeChecked()
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
