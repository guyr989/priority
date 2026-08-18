export interface Store<T> {
    read(): T | null
    write(value: T): void
}
