/**
 * What a player can tell us about itself. No vendor, no DOM: the api layer
 * owns the element and hands back one of these.
 */
export interface PlaybackSource {
    /** Transport state at the moment the source was attached. */
    readonly isPlaying: boolean
    /** Reports every transport change. Returns the detach function. */
    subscribe(onChange: (isPlaying: boolean) => void): () => void
}
