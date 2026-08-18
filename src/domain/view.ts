export type ViewMode = 'list' | 'tile'

export function isViewMode(value: unknown): value is ViewMode {
    return value === 'list' || value === 'tile'
}
