import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { PaletteId } from '../domain/appearance'
import styles from './CosmicBackground.module.css'

/**
 * The ring is an ellipse, not a circle: it spans this much of each axis, so it
 * fills a wide desktop and a tall phone instead of hiding behind the panel.
 */
const DISK_SPAN = 0.84
/** Where the ball used to be. Nothing is drawn inside this share of the radius. */
const RING_INNER = 0.44
const DISK_STARS = 420
const FIELD_STARS = 140
/** One lap in a little over a minute. Slow enough to read as drift, not motion. */
const TURNS_PER_SECOND = 0.013
const MAX_DPR = 2

/** One thump every four and a half seconds. Deep sleep, not a resting heart. */
const BEAT_SECONDS = 4.5
/** As a share of the cycle, so about 160ms either side of the peak. */
const THUMP_WIDTH = 0.035
/** What one thump is worth: a little wider, quite a lot brighter. */
const BEAT_REACH = 0.04
const BEAT_GLOW = 0.6

/**
 * A light palette cannot use an additive blend — adding to white stays white,
 * so the ring would vanish. Those paint dark ink the ordinary way instead.
 */
const BLENDS = ['lighter', 'source-over'] as const
type Blend = (typeof BLENDS)[number]

interface Sky {
  readonly hueNear: number
  readonly hueFar: number
  readonly saturation: number
  readonly lightness: number
  readonly strength: number
  readonly blend: Blend
}

/** What the canvas paints when a palette says nothing about the sky. */
const DEFAULT_SKY: Sky = {
  hueNear: 190,
  hueFar: 270,
  saturation: 90,
  lightness: 72,
  strength: 1,
  blend: 'lighter',
}

function readNumber(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const value = Number.parseFloat(style.getPropertyValue(name))
  return Number.isFinite(value) ? value : fallback
}

/**
 * The palette owns the colours, the same as every other token in this app. The
 * canvas only asks what the current one says. A blend arrives as free text, so
 * it is checked against the two the canvas knows rather than trusted.
 */
function readSky(element: Element): Sky {
  const style = getComputedStyle(element)
  const blend = style.getPropertyValue('--sky-blend').trim()
  return {
    hueNear: readNumber(style, '--sky-hue-near', DEFAULT_SKY.hueNear),
    hueFar: readNumber(style, '--sky-hue-far', DEFAULT_SKY.hueFar),
    saturation: readNumber(style, '--sky-saturation', DEFAULT_SKY.saturation),
    lightness: readNumber(style, '--sky-lightness', DEFAULT_SKY.lightness),
    strength: readNumber(style, '--sky-strength', DEFAULT_SKY.strength),
    blend: BLENDS.find((known) => known === blend) ?? DEFAULT_SKY.blend,
  }
}

function thump(at: number, now: number): number {
  const gap = now - at
  return Math.exp(-(gap * gap) / (2 * THUMP_WIDTH * THUMP_WIDTH))
}

/**
 * One thump, then a long rest. The rest is what makes it read as a pulse
 * rather than as breathing. The thump at 1 is the next beat's, so the rise is
 * already under way when the cycle turns over.
 */
function heartbeat(seconds: number): number {
  const now = (seconds % BEAT_SECONDS) / BEAT_SECONDS
  return thump(0, now) + thump(1, now)
}

interface DiskStar {
  angle: number
  /** 0 at the inner edge of the ring, 1 at the outer. Resolved to px per frame. */
  spread: number
  size: number
  alpha: number
  phase: number
  twinkle: number
}

interface FieldStar {
  x: number
  y: number
  size: number
  alpha: number
  phase: number
  twinkle: number
}

function makeDiskStar(): DiskStar {
  /** sqrt keeps the ring evenly covered; a flat random crowds the inner edge. */
  const spread = Math.sqrt(Math.random())
  return {
    angle: Math.random() * Math.PI * 2,
    spread,
    size: 0.7 + Math.random() * 1.9,
    alpha: 0.34 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    twinkle: 0.4 + Math.random() * 1.1,
  }
}

function makeFieldStar(): FieldStar {
  return {
    x: Math.random(),
    y: Math.random(),
    size: 0.5 + Math.random() * 1.1,
    alpha: 0.16 + Math.random() * 0.3,
    phase: Math.random() * Math.PI * 2,
    twinkle: 0.2 + Math.random() * 0.6,
  }
}

interface CosmicBackgroundProps {
  /** A palette can switch the sky off outright by setting --sky-strength to 0. */
  readonly paletteId: PaletteId
  /**
   * The ring centres on this box rather than on the window, so it stays a halo
   * around the panel at any layout. Missing or unmounted: the window centre.
   */
  readonly centreOn?: RefObject<HTMLElement | null>
}

/**
 * Decoration only, so it is hidden from the accessibility tree and never takes
 * a pointer. Nothing here reaches the network: the whole sky is arithmetic.
 */
export function CosmicBackground({ paletteId, centreOn }: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const context = canvas.getContext('2d')
    if (context === null) return

    const still =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* Read once per palette, not per frame: getComputedStyle is not cheap. */
    const sky = readSky(canvas)
    const disk = Array.from({ length: DISK_STARS }, makeDiskStar)
    const field = Array.from({ length: FIELD_STARS }, makeFieldStar)

    let width = 0
    let height = 0
    let centreX = 0
    let centreY = 0

    /*
     * One layout read per frame, of one element, and the paint that follows
     * writes nothing to the DOM — so it never thrashes. Reading it every frame
     * rather than observing the box keeps it right when the panel merely moves,
     * which a ResizeObserver would not report.
     */
    function measure() {
      const target = centreOn?.current ?? null
      if (target === null) {
        centreX = width / 2
        centreY = height / 2
        return
      }
      const box = target.getBoundingClientRect()
      centreX = box.left + box.width / 2
      centreY = box.top + box.height / 2
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      context!.setTransform(dpr, 0, 0, dpr, 0, 0)
      measure()
    }

    function paint(seconds: number) {
      const ctx = context!
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = sky.blend

      /* A still page gets the rest between beats, never a thump. */
      const beat = still ? 0 : heartbeat(seconds)
      const glow = sky.strength * (1 + beat * BEAT_GLOW)
      const fieldColour = `hsl(${sky.hueFar} 30% ${sky.lightness}%)`

      for (const star of field) {
        const flicker = 0.65 + 0.35 * Math.sin(seconds * star.twinkle + star.phase)
        ctx.globalAlpha = Math.min(star.alpha * flicker * sky.strength, 1)
        ctx.fillStyle = fieldColour
        ctx.fillRect(star.x * width, star.y * height, star.size, star.size)
      }

      /* One radius per axis, so the ring reaches DISK_SPAN of both edges. */
      const rx = (width * DISK_SPAN) / 2
      const ry = (height * DISK_SPAN) / 2

      for (const star of disk) {
        const reach =
          (RING_INNER + (1 - RING_INNER) * star.spread) * (1 + beat * BEAT_REACH)
        const x = centreX + Math.cos(star.angle) * rx * reach
        const y = centreY + Math.sin(star.angle) * ry * reach
        const flicker = 0.7 + 0.3 * Math.sin(seconds * star.twinkle + star.phase)
        const hue = sky.hueNear + star.spread * (sky.hueFar - sky.hueNear)
        ctx.globalAlpha = Math.min(star.alpha * flicker * glow, 1)
        ctx.fillStyle = `hsl(${hue} ${sky.saturation}% ${sky.lightness}%)`
        ctx.beginPath()
        ctx.arc(x, y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    let frame = 0
    let last = 0
    let elapsed = 0

    function step(now: number) {
      const delta = last === 0 ? 0 : Math.min((now - last) / 1000, 0.1)
      last = now
      elapsed += delta
      const turn = delta * TURNS_PER_SECOND * Math.PI * 2
      for (const star of disk) star.angle += turn
      measure()
      paint(elapsed)
      frame = requestAnimationFrame(step)
    }

    function start() {
      if (frame !== 0 || document.hidden) return
      last = 0
      frame = requestAnimationFrame(step)
    }

    function stop() {
      if (frame === 0) return
      cancelAnimationFrame(frame)
      frame = 0
    }

    function onVisibility() {
      if (document.hidden) stop()
      else if (!still) start()
    }

    function onResize() {
      resize()
      if (still) paint(0)
    }

    resize()

    /*
     * Nothing here is on the critical path, so the first frame waits for the
     * browser to be idle rather than competing with the app's own first paint.
     */
    let idle = 0
    let timer = 0
    if (still) {
      paint(0)
    } else if (typeof window.requestIdleCallback === 'function') {
      idle = window.requestIdleCallback(start, { timeout: 2000 })
    } else {
      timer = window.setTimeout(start, 300)
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      if (idle !== 0) window.cancelIdleCallback(idle)
      if (timer !== 0) window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [paletteId, centreOn])

  return <canvas ref={canvasRef} className={styles.sky} aria-hidden="true" />
}
