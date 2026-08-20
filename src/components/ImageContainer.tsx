import type { RefObject } from 'react'
import type { Track } from '../domain/track'
import styles from './ImageContainer.module.css'
import { strings } from '../i18n/strings'

interface SleeveProps {
  readonly track: Track
  readonly showDisc: boolean
  readonly embedded: boolean
  readonly isPlaying: boolean
}

function Sleeve({ track, showDisc, embedded, isPlaying }: SleeveProps) {
  return (
    <>
      <span className={styles.cover}>
        {/*
          The cover is the largest thing painted, so on a return visit with a
          track restored from storage it is the page's LCP. Its URL only exists
          once the app has run, so it cannot be preloaded from the document —
          the priority hint is the one lever left.
        */}
        <img
          key={track.id}
          className={styles.image}
          src={track.imageUrl}
          crossOrigin="anonymous"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          alt={strings.sleeve.cover(track.title, track.artist)}
        />
        {showDisc && (
          <span className={styles.play} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
              <path d="M8.7 5.3 19.3 12 8.7 18.7Z" fill="currentColor" />
            </svg>
          </span>
        )}
      </span>
      <span className={styles.caption}>
        {embedded && (
          <span
            className={
              isPlaying ? styles.equaliser : `${styles.equaliser} ${styles.equaliserPaused}`
            }
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
        )}
        {track.title}
      </span>
      <span className={styles.artist}>{track.artist}</span>
    </>
  )
}

interface ImageContainerProps {
  readonly track: Track | null
  readonly sectionRef?: RefObject<HTMLElement | null>
  readonly slotRef?: RefObject<HTMLDivElement | null>
  /** Looks that carry no player show the sleeve as artwork, not as a control. */
  readonly playable: boolean
  /** The player is on the page. */
  readonly embedded: boolean
  /** The player is actually running, which the player itself decides. */
  readonly isPlaying: boolean
  /**
   * Where the column has no room for a standing cover, the sleeve lies down:
   * a thumbnail with its billing beside it, the way a phone player reads.
   */
  readonly lieDown: boolean
  readonly onImageClick: () => void
}

export function ImageContainer({
  track,
  sectionRef,
  slotRef,
  playable,
  embedded,
  isPlaying,
  lieDown,
  onImageClick,
}: ImageContainerProps) {
  return (
    <section
      ref={sectionRef}
      id="image-container"
      className={lieDown ? `${styles.container} ${styles.lieDown}` : styles.container}
      aria-labelledby="image-heading"
      tabIndex={-1}
    >
      <h2 id="image-heading" className={styles.heading}>
        {strings.sleeve.heading}
      </h2>

      <div className={styles.slot} ref={slotRef}>
        {track === null && <div className={styles.pad} aria-hidden="true" />}

        {track !== null && playable && (
          <button
            type="button"
            className={`${styles.sleeve} ${styles.imageButton}`}
            aria-label={
              embedded
                ? strings.sleeve.cover(track.title, track.artist)
                : strings.sleeve.play(track.title, track.artist)
            }
            onClick={onImageClick}
          >
            <Sleeve
              track={track}
              showDisc={!embedded}
              embedded={embedded}
              isPlaying={isPlaying}
            />
          </button>
        )}

        {track !== null && !playable && (
          <div className={styles.sleeve}>
            <Sleeve track={track} showDisc={false} embedded={false} isPlaying={false} />
          </div>
        )}
      </div>

    </section>
  )
}
