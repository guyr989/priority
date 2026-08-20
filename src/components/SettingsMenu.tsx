import { useCallback, useEffect, useRef, useState } from 'react'
import type { LayoutId, Palette, PaletteId } from '../domain/appearance'
import styles from './SettingsMenu.module.css'
import { strings } from '../i18n/strings'

interface SettingsMenuProps {
  readonly palettes: readonly Palette[]
  readonly palette: Palette
  readonly layouts: readonly LayoutId[]
  readonly layout: LayoutId
  readonly playerOn: boolean
  readonly onChoosePalette: (id: PaletteId) => void
  readonly onChooseLayout: (id: LayoutId) => void
  readonly onChoosePlayer: (on: boolean) => void
  readonly onClearStored: () => void
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
  onClearStored,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  // Closing the panel disarms the confirmation, so it is never already armed
  // the next time the menu is opened.
  const [armed, setArmed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  /*
   * Closing the panel disarms the confirmation, so it is never already armed
   * the next time the menu is opened. Both happen here rather than in an
   * effect watching `open`: closing is one act, not a state to observe after
   * the fact, and a setState inside an effect only cascades a second render.
   */
  const close = useCallback(() => {
    setOpen(false)
    setArmed(false)
  }, [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      close()
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-label={strings.settings.trigger}
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={() => (open ? close() : setOpen(true))}
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
            {strings.player.region}
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
              {playerOn ? strings.player.on : strings.player.off}
            </span>
            <span className={styles.track} aria-hidden="true">
              <span className={styles.knob} />
            </span>
          </button>
        </div>

        <fieldset className={styles.set}>
          <legend className={styles.legend}>{strings.settings.colour}</legend>

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
              <span className={styles.name}>{strings.palettes[option.id].name}</span>
              <span className={styles.note}>{strings.palettes[option.id].note}</span>
            </label>
          ))}
        </fieldset>

        {/* The choice arranges the search column against the sleeve, so it
            needs both a sleeve to arrange and more than the single column a
            phone has. Without either, the whole fieldset goes rather than
            offering controls that move nothing on the page. */}
        {layouts.length > 0 && (
        <fieldset className={styles.set}>
          <legend className={styles.legend}>{strings.settings.layout}</legend>

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
              <span className={styles.name}>{strings.layouts[option].name}</span>
              <span className={styles.note}>{strings.layouts[option].note}</span>
            </label>
          ))}
        </fieldset>
        )}

        {/*
          Clearing cannot be undone and there is nothing to put back, so the
          control asks once before it does it. The action keeps its name across
          both steps: the button that arms it and the button that carries it
          out both say Clear.
        */}
        <fieldset className={styles.set}>
          <legend className={styles.legend}>{strings.settings.stored}</legend>

          {armed ? (
            <div className={styles.confirm}>
              <p className={styles.ask}>{strings.settings.clearAsk}</p>
              <div className={styles.answers}>
                <button
                  type="button"
                  className={styles.destructive}
                  autoFocus
                  onClick={() => {
                    setArmed(false)
                    onClearStored()
                  }}
                >
                  {strings.settings.clear}
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => setArmed(false)}
                >
                  {strings.settings.clearKeep}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.action}
              onClick={() => setArmed(true)}
            >
              <span>{strings.settings.clear}</span>
              <span className={styles.ask}>{strings.settings.clearNote}</span>
            </button>
          )}
        </fieldset>
      </div>
    </div>
  )
}
