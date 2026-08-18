import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import styles from './FlyingResult.module.css'

const FLIGHT_MS = 420
const FLIGHT_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

interface FlyingResultProps {
  readonly label: string
  readonly from: DOMRect
  readonly targetRef: RefObject<HTMLElement | null>
  readonly onFinish: () => void
}

export function FlyingResult({ label, from, targetRef, onFinish }: FlyingResultProps) {
  const ghostRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ghost = ghostRef.current
    const target = targetRef.current

    if (ghost === null || target === null || typeof ghost.animate !== 'function') {
      onFinish()
      return
    }

    const to = target.getBoundingClientRect()
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    const scale = Math.min(to.width / from.width, 1)

    const flight = ghost.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
      ],
      { duration: FLIGHT_MS, easing: FLIGHT_EASING, fill: 'forwards' },
    )

    flight.onfinish = () => onFinish()

    return () => {
      flight.cancel()
    }
  }, [from, targetRef, onFinish])

  return (
    <div
      ref={ghostRef}
      className={styles.ghost}
      aria-hidden="true"
      style={{
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
      }}
    >
      {label}
    </div>
  )
}
