import { useEffect, useRef, useState } from 'react'
import type { LayoutId, Palette, PaletteId } from '../domain/appearance'
import styles from './SettingsMenu.module.css'

/** Copy lives with the view; domain/ keeps the structure. */
const PALETTE_COPY: Record<PaletteId, { readonly name: string; readonly note: string }> = {
  studio: { name: 'Studio', note: 'Light panels, violet accent. Follows your system.' },
  desk: { name: 'Desk', note: 'Low light, blue-black, a red record lamp.' },
  cinema: { name: 'Cinema', note: 'The cover fills the room behind the page.' },
  daylight: { name: 'Daylight', note: 'Cool paper under a bright window.' },
}

const LAYOUT_COPY: Record<LayoutId, { readonly name: string; readonly note: string }> = {
  side: { name: 'Sidebar', note: 'Search leads, the sleeve keeps a column beside it.' },
  stack: { name: 'Stacked', note: 'One narrow column, the sleeve below the search.' },
  banner: { name: 'Banner', note: 'Full width, the sleeve laid across.' },
  row: { name: 'Row', note: 'Search, results and sleeve in a single row.' },
}

interface SettingsMenuProps {
  readonly palettes: readonly Palette[]
  readonly palette: Palette
  readonly layouts: readonly LayoutId[]
  readonly layout: LayoutId
  readonly playerOn: boolean
  readonly onChoosePalette: (id: PaletteId) => void
  readonly onChooseLayout: (id: LayoutId) => void
  readonly onChoosePlayer: (on: boolean) => void
}

export function SettingsMenu({
  palettes,
  palette,
  layouts,
  layout,
  playerOn,
  onChoosePalette,
  onChooseLayout,
  onChoosePlayer,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const close = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-label="Settings"
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={() => setOpen((was) => !was)}
      >
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false">
          <path
            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M19.4 13a7.6 7.6 0 0 0 0-2l1.8-1.4-1.9-3.2-2.1.8a7.6 7.6 0 0 0-1.8-1L15.1 3h-3.8l-.3 2.2a7.6 7.6 0 0 0-1.8 1l-2.1-.8-1.9 3.2L6.9 11a7.6 7.6 0 0 0 0 2l-1.8 1.4 1.9 3.2 2.1-.8a7.6 7.6 0 0 0 1.8 1l.3 2.2h3.8l.3-2.2a7.6 7.6 0 0 0 1.8-1l2.1.8 1.9-3.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Always in the DOM so aria-controls points at something real. */}
      <div className={styles.panel} id="settings-panel" hidden={!open}>
        <div className={styles.group}>
          <span className={styles.legend} id="player-legend">
            Player
          </span>
          <button
            type="button"
            role="switch"
            className={styles.switch}
            aria-checked={playerOn}
            aria-labelledby="player-legend"
            onClick={() => onChoosePlayer(!playerOn)}
          >
            <span className={styles.switchText}>
              {playerOn ? 'On the page' : 'Off'}
            </span>
            <span className={styles.track} aria-hidden="true">
              <span className={styles.knob} />
            </span>
          </button>
        </div>

        <fieldset className={styles.set}>
          <legend className={styles.legend}>Colour</legend>

          {palettes.map((option) => (
            <label
              key={option.id}
              className={styles.option}
              data-chosen={option.id === palette.id}
            >
              <input
                type="radio"
                name="palette"
                className={styles.radio}
                value={option.id}
                checked={option.id === palette.id}
                onChange={() => onChoosePalette(option.id)}
              />
              <span className={styles.chip} data-palette={option.id} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className={styles.name}>{PALETTE_COPY[option.id].name}</span>
              <span className={styles.note}>{PALETTE_COPY[option.id].note}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.set}>
          <legend className={styles.legend}>Layout</legend>

          {layouts.map((option) => (
            <label
              key={option}
              className={styles.option}
              data-chosen={option === layout}
            >
              <input
                type="radio"
                name="layout"
                className={styles.radio}
                value={option}
                checked={option === layout}
                onChange={() => onChooseLayout(option)}
              />
              <span className={styles.plan} data-layout={option} aria-hidden="true">
                <span />
                <span />
              </span>
              <span className={styles.name}>{LAYOUT_COPY[option].name}</span>
              <span className={styles.note}>{LAYOUT_COPY[option].note}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  )
}
