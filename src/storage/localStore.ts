import type { Store } from './store'

export function createLocalStore<T>(
    key: string,
    isValid: (value: unknown) => value is T,
): Store<T> {
    return {
        read() {
            try {
                const raw = window.localStorage.getItem(key)
                if (raw === null) return null

                const parsed: unknown = JSON.parse(raw)
                return isValid(parsed) ? parsed : null
            } catch {
                return null
            }
        },

        write(value) {
            try {
                window.localStorage.setItem(key, JSON.stringify(value))
            } catch {
                return
            }
        },
    }
}
