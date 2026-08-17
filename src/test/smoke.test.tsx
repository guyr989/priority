import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('test harness', () => {
  it('renders into jsdom with jest-dom matchers registered', () => {
    render(<h1>ready</h1>)

    expect(screen.getByRole('heading', { name: 'ready' })).toBeInTheDocument()
  })
})
