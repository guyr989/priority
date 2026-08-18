import type { Page } from './page'


export interface PaginationState {
    readonly cursor: string | null
    readonly nextCursor: string | null
    readonly prevCursor: string | null
}

export const initialPagination: PaginationState = {
    cursor: null,
    nextCursor: null,
    prevCursor: null,
}

export function resetPagination(): PaginationState {
    return initialPagination
}

export function receivePage(
    state: PaginationState,
    page: Page<unknown>,
): PaginationState {
    return {
        cursor: state.cursor,
        nextCursor: page.nextCursor,
        prevCursor: page.prevCursor,
    }
}

export function canGoNext(state: PaginationState): boolean {
    return state.nextCursor !== null
}

export function canGoPrev(state: PaginationState): boolean {
    return state.prevCursor !== null
}


export function goNext(state: PaginationState): PaginationState {
    if (state.nextCursor === null) return state
    return { cursor: state.nextCursor, nextCursor: null, prevCursor: null }
}

export function goPrev(state: PaginationState): PaginationState {
    if (state.prevCursor === null) return state
    return { cursor: state.prevCursor, nextCursor: null, prevCursor: null }
}
