import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FlyingResult } from './FlyingResult'

function renderFlight(onFinish: () => void) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  const targetRef = createRef<HTMLElement>()
  Object.assign(targetRef, { current: target })

  render(
    <FlyingResult
      label="a track"
      from={new DOMRect(20, 100, 300, 40)}
      targetRef={targetRef}
      onFinish={onFinish}
    />,
  )
}

describe('FlyingResult', () => {
  it('lands immediately when the browser cannot animate', () => {
    const onFinish = vi.fn()

    renderFlight(onFinish)

    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('shows the label in flight and lands when the animation finishes', () => {
    const animation = { onfinish: null as (() => void) | null, cancel: vi.fn() }
    Object.defineProperty(Element.prototype, 'animate', {
      value: () => animation as unknown as Animation,
      configurable: true,
      writable: true,
    })
    const onFinish = vi.fn()

    renderFlight(onFinish)

    expect(screen.getByText('a track')).toBeInTheDocument()
    expect(onFinish).not.toHaveBeenCalled()

    animation.onfinish?.()

    expect(onFinish).toHaveBeenCalledOnce()
    Reflect.deleteProperty(Element.prototype, 'animate')
  })

  it('lands at once when the tab is hidden, where animations do not run', () => {
    Object.defineProperty(Element.prototype, 'animate', {
      value: () => ({ onfinish: null, cancel: vi.fn() }) as unknown as Animation,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    const onFinish = vi.fn()

    renderFlight(onFinish)

    expect(onFinish).toHaveBeenCalledOnce()

    Reflect.deleteProperty(Element.prototype, 'animate')
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
  })

  it('is hidden from assistive technology', () => {
    renderFlight(vi.fn())

    expect(screen.getByText('a track')).toHaveAttribute('aria-hidden', 'true')
  })
})
