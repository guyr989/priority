export const HISTORY_LIMIT = 5

function isSameTerm(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase()
}

function extendsPreviousTerm(history: readonly string[], term: string): boolean {
    const [latest] = history
    if (latest === undefined) return false
    return !isSameTerm(latest, term) && term.toLowerCase().startsWith(latest.toLowerCase())
}

export function addSearch(history: readonly string[], term: string): readonly string[] {
    const trimmed = term.trim()
    if (trimmed === '') return history

    const kept = extendsPreviousTerm(history, trimmed) ? history.slice(1) : history

    return [trimmed, ...kept.filter((entry) => !isSameTerm(entry, trimmed))].slice(
        0,
        HISTORY_LIMIT,
    )
}

export function isHistory(value: unknown): value is readonly string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}
