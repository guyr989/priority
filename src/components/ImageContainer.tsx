import type { RefObject } from 'react'
import type { Track } from '../domain/track'
import styles from './ImageContainer.module.css'
import { strings } from '../i18n/strings'

/**
 * Stands in for a cover the provider cannot serve. A data URI so the swap
 * costs no request, and semi-transparent so it takes the tone of the sleeve
 * it lands in rather than glowing in the dark palette.
 */
const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23808080' fill-opacity='.16'/%3E%3Cg fill='none' stroke='%23808080' stroke-opacity='.5' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M42 66V34l28-6v30'/%3E%3Ccircle cx='35' cy='66' r='7'/%3E%3Ccircle cx='63' cy='58' r='7'/%3E%3C/g%3E%3C/svg%3E"

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
          src={track.imageUrl || FALLBACK_COVER}
          /* The one cover with real alt text, so the one whose failure the
             browser draws as a broken glyph beside it. */
          onError={(event) => {
            event.currentTarget.src = FALLBACK_COVER
          }}
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
