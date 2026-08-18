import type { PlaybackSource } from "../domain/playback"

const WIDGET_API = "https://widget.mixcloud.com/media/js/widgetApi.js"

interface WidgetEvent {
    on(handler: () => void): void
    off(handler: () => void): void
}

interface Widget {
    ready: Promise<unknown>
    getIsPaused(): Promise<boolean>
    events: {
        play: WidgetEvent
        pause: WidgetEvent
        ended: WidgetEvent
    }
}

type WidgetFactory = (frame: HTMLIFrameElement) => Widget

let pendingScript: Promise<void> | null = null

function loadWidgetApi(): Promise<void> {
    if (pendingScript !== null) return pendingScript

    pendingScript = new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = WIDGET_API
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => {
            pendingScript = null
            reject(new Error("The player API did not load"))
        }
        document.head.appendChild(script)
    })

    return pendingScript
}

function readWidgetFactory(): WidgetFactory | null {
    const global = window as unknown as { Mixcloud?: { PlayerWidget?: unknown } }
    const factory = global.Mixcloud?.PlayerWidget
    return typeof factory === "function" ? (factory as WidgetFactory) : null
}

/**
 * Talks to the embedded player over its own postMessage API, so a press on the
 * player's transport is reported back to us. Returns null when the player
 * cannot be reached: the caller then keeps whatever state it already had.
 */
export async function attachPlayback(frame: HTMLIFrameElement): Promise<PlaybackSource | null> {
    try {
        await loadWidgetApi()

        const create = readWidgetFactory()
        if (create === null) return null

        const widget = create(frame)
        await widget.ready

        return {
            isPlaying: !(await widget.getIsPaused()),

            subscribe(onChange) {
                const started = () => onChange(true)
                const stopped = () => onChange(false)

                widget.events.play.on(started)
                widget.events.pause.on(stopped)
                widget.events.ended.on(stopped)

                return () => {
                    widget.events.play.off(started)
                    widget.events.pause.off(stopped)
                    widget.events.ended.off(stopped)
                }
            },
        }
    } catch {
        return null
    }
}
