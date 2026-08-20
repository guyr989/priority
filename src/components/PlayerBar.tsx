import type { RefObject } from 'react'
import type { Track } from '../domain/track'
import styles from './PlayerBar.module.css'
import { strings } from '../i18n/strings'

interface PlayerBarProps {
  readonly track: Track
  readonly frameRef?: RefObject<HTMLIFrameElement | null>
  readonly onClose: () => void
}

/**
 * The player holds the foot of the window so the track stays reachable however
 * far the results run. The sleeve keeps the artwork and the play control; only
 * the provider's transport lives down here.
 */
export function PlayerBar({ track, frameRef, onClose }: PlayerBarProps) {
  return (
    <aside id="player-bar" className={styles.bar} aria-label={strings.player.region}>
      <div className={styles.inner}>
        <p className={styles.billing}>
          <span className={styles.title}>{track.title}</span>
          <span className={styles.artist}>{track.artist}</span>
        </p>

        <iframe
          ref={frameRef}
          className={styles.frame}
          title={strings.player.frameTitle(track.title)}
          src={track.embedUrl}
          allow="autoplay; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        <button
          type="button"
          className={styles.close}
          aria-label={strings.player.close}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </aside>
  )
}
