import type { RefObject } from 'react'
import type { Track } from '../domain/track'
import styles from './ImageContainer.module.css'

interface ImageContainerProps {
  readonly track: Track | null
  readonly sectionRef?: RefObject<HTMLElement | null>
  readonly slotRef?: RefObject<HTMLDivElement | null>
  readonly isPlaying: boolean
  readonly onImageClick: () => void
}

export function ImageContainer({
  track,
  sectionRef,
  slotRef,
  isPlaying,
  onImageClick,
}: ImageContainerProps) {
  return (
    <section
      ref={sectionRef}
      id="image-container"
      className={styles.container}
      aria-labelledby="image-heading"
      tabIndex={-1}
    >
      <h2 id="image-heading" className={styles.heading}>
        Now playing
      </h2>

      <div className={styles.slot} ref={slotRef}>
        {track === null ? (
          <div className={styles.pad} aria-hidden="true" />
        ) : (
          <button
            type="button"
            className={styles.imageButton}
            aria-label={
              isPlaying
                ? `${track.title} by ${track.artist}`
                : `Play ${track.title} by ${track.artist}`
            }
            onClick={onImageClick}
          >
            <span className={styles.cover}>
              <img
                key={track.id}
                className={styles.image}
                src={track.imageUrl}
                referrerPolicy="no-referrer"
                alt={`${track.title} by ${track.artist}`}
              />
              {!isPlaying && (
                <span className={styles.play} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
                    <path d="M8.7 5.3 19.3 12 8.7 18.7Z" fill="currentColor" />
                  </svg>
                </span>
              )}
            </span>
            <span className={styles.caption}>
              {isPlaying && (
                <span className={styles.equaliser} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              )}
              {track.title}
            </span>
            <span className={styles.artist}>{track.artist}</span>
          </button>
        )}
      </div>

      {track !== null && isPlaying && (
        <iframe
          className={styles.player}
          title={`${track.title} player`}
          src={track.embedUrl}
          allow="autoplay"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      )}
    </section>
  )
}
