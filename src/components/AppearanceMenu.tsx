import { useEffect, useRef, useState } from 'react'
import type { Appearance } from '../domain/appearance'
import styles from './AppearanceMenu.module.css'

interface AppearanceMenuProps {
  readonly looks: readonly Appearance[]
  readonly current: Appearance
  readonly onChoose: (id: string) => void
}

export function AppearanceMenu({ looks, current, onChoose }: AppearanceMenuProps) {
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
        aria-expanded={open}
        aria-controls="appearance-panel"
        onClick={() => setOpen((was) => !was)}
      >
        <span className={styles.chip} data-appearance={current.id} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        Appearance
      </button>

      {open && (
        <div className={styles.panel} id="appearance-panel">
          <fieldset className={styles.set}>
            <legend className={styles.legend}>Pick a look</legend>

            {looks.map((look) => (
              <label
                key={look.id}
                className={styles.look}
                data-chosen={look.id === current.id}
              >
                <input
                  type="radio"
                  name="appearance"
                  className={styles.radio}
                  value={look.id}
                  checked={look.id === current.id}
                  onChange={() => {
                    onChoose(look.id)
                    setOpen(false)
                    buttonRef.current?.focus()
                  }}
                />
                <span className={styles.chip} data-appearance={look.id} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className={styles.name}>{look.name}</span>
                <span className={styles.note}>{look.note}</span>
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </div>
  )
}
