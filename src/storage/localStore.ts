import type { Store } from './store'

/**
 * Forgets the given keys. Takes the keys rather than the stores, because
 * removing a value is not something a typed reader and writer of one value
 * has any business doing.
 */
export function clearLocalStores(keys: readonly string[]): void {
    for (const key of keys) {
        try {
            window.localStorage.removeItem(key)
        } catch {
            // A device that will not let us forget is one we cannot help here.
        }
    }
}

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
