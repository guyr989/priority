import type { Track } from '../domain/track'
import styles from './ImageContainer.module.css'

interface ImageContainerProps {
  readonly track: Track | null
  readonly onImageClick: () => void
}

export function ImageContainer({ track, onImageClick }: ImageContainerProps) {
  return (
    <section
      id="image-container"
      className={styles.container}
      aria-labelledby="image-heading"
      tabIndex={-1}
    >
      <h2 id="image-heading" className={styles.heading}>
        Now showing
      </h2>

      {track === null ? (
        <p className={styles.placeholder}>
          Select a result to see its artwork here.
        </p>
      ) : (
        <button
          type="button"
          className={styles.imageButton}
          onClick={onImageClick}
        >
          <img
            className={styles.image}
            src={track.imageUrl}
            alt={`${track.title} by ${track.artist}`}
          />
          <span className={styles.caption}>{track.title}</span>
        </button>
      )}
    </section>
  )
}
