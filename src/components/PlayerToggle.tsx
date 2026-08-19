import styles from './PlayerToggle.module.css'

interface PlayerToggleProps {
  /** Whether the page is carrying a player at all. */
  readonly on: boolean
  readonly onChange: (on: boolean) => void
}

/**
 * A disclosure, not a transport control. It decides whether the page carries a
 * player at all; it never starts or stops what is already running. The label
 * says which of the two it is, because a switch alone cannot.
 */
export function PlayerToggle({ on, onChange }: PlayerToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-expanded={on}
      onClick={() => onChange(!on)}
    >
      <svg
        className={styles.chevron}
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M4 6.5 8 10.5 12 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {on ? 'Hide player' : 'Show player'}
    </button>
  )
}
