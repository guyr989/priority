import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import styles from './FlyingResult.module.css'

const FLIGHT_MS = 520
const FLIGHT_EASING = 'cubic-bezier(0.32, 0.04, 0.16, 1)'
const SWELL = 1.06

interface FlyingResultProps {
  readonly label: string
  readonly from: DOMRect
  readonly targetRef: RefObject<HTMLElement | null>
  readonly onFinish: () => void
}

export function FlyingResult({ label, from, targetRef, onFinish }: FlyingResultProps) {
  const ghostRef = useRef<HTMLDivElement>(null)
  const finish = useRef(onFinish)

  useEffect(() => {
    finish.current = onFinish
  }, [onFinish])

  useLayoutEffect(() => {
    const ghost = ghostRef.current
    const target = targetRef.current

    // A hidden tab throttles animations, so the flight would never report back
    // and the sleeve would stay empty with the ghost stuck on screen.
    if (
      ghost === null ||
      target === null ||
      typeof ghost.animate !== 'function' ||
      document.hidden
    ) {
      finish.current()
      return
    }

    const to = target.getBoundingClientRect()
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    const scale = Math.min(to.width / from.width, 1)

    // Thrown rather than slid: it swells and rises off its line, then drops
    // into the sleeve, and only lets go of its colour at the end.
    const lift = Math.min(Math.abs(dy) * 0.3 + 36, 130)

    const flight = ghost.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        {
          transform: `translate(${dx * 0.5}px, ${dy * 0.4 - lift}px) scale(${SWELL})`,
          opacity: 1,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0, offset: 1 },
      ],
      { duration: FLIGHT_MS, easing: FLIGHT_EASING, fill: 'forwards' },
    )

    flight.onfinish = () => finish.current()

    // Same reason, for a tab that goes away mid-flight: land it regardless.
    const guard = window.setTimeout(() => finish.current(), FLIGHT_MS + 200)

    return () => {
      window.clearTimeout(guard)
      flight.cancel()
    }
  }, [from, targetRef])

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
