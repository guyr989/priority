import styles from './PlayerToggle.module.css'

interface PlayerToggleProps {
  /** Whether the page is carrying a player at all. */
  readonly on: boolean
  readonly onChange: (on: boolean) => void
}

/**
 * One control: the word names the thing, the pill carries the state. It decides
 * whether the page carries a player at all and never starts or stops what is
 * already running, which is what the title spells out on hover.
 */
export function PlayerToggle({ on, onChange }: PlayerToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      className={styles.toggle}
      aria-checked={on}
      title="Show or hide the player"
      onClick={() => onChange(!on)}
    >
      Player
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </button>
  )
}
