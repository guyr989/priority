import type { PlaybackSource } from "../domain/playback"

const WIDGET_API = "https://widget.mixcloud.com/media/js/widgetApi.js"

interface WidgetEvent {
    on(handler: () => void): void
    off(handler: () => void): void
}

interface Widget {
    ready: Promise<unknown>
    play(): Promise<unknown>
    getIsPaused(): Promise<boolean>
    events: {
        play: WidgetEvent
        pause: WidgetEvent
        ended: WidgetEvent
    }
}

type WidgetFactory = (frame: HTMLIFrameElement) => Widget

let pendingScript: Promise<void> | null = null

/**
 * The library registers exactly one window 'message' listener per widget, in its
 * constructor, synchronously, and never removes it — measured: three widgets add
 * three listeners. Since the registration is synchronous we can catch it and
 * hand back a release, so a finished player leaves nothing behind.
 */
function build(create: WidgetFactory, frame: HTMLIFrameElement) {
    const registered: EventListener[] = []
    const original = window.addEventListener.bind(window)
    const patched = (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void => {
        if (type === "message" && typeof listener === "function") registered.push(listener)
        original(type, listener, options)
    }

    window.addEventListener = patched as typeof window.addEventListener

    try {
        return {
            widget: create(frame),
            release: () => {
                registered.forEach((listener) => window.removeEventListener("message", listener))
                registered.length = 0
            },
        }
    } finally {
        window.addEventListener = original
    }
}

/**
 * The embed's own autoplay flag is a request the browser may refuse, and it
 * races the frame's load either way — which is what left a listener pressing
 * play a second time inside the iframe. Asking the widget itself, once it has
 * said it is ready, is the deterministic path. Calling it on a player already
 * running is a no-op, so the flag can stay as the fallback for a widget API
 * that never loads.
 */
async function start(widget: Widget): Promise<void> {
    try {
        await widget.play()
    } catch {
        // A player that will not start on request still reports its own state.
    }
}

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

        const { widget, release } = build(create, frame)
        await widget.ready
        await start(widget)

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
                    release()
                }
            },
        }
    } catch {
        return null
    }
}
