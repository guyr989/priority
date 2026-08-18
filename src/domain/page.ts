export interface Page<T> {
    readonly items: readonly T[];
    readonly nextCursor: string | null;
    readonly prevCursor: string | null;
}