export interface Track {
    readonly id: string;
    readonly title: string;
    readonly artist: string;
    readonly imageUrl: string;
    readonly embedUrl: string;
}

export function isTrack(value: unknown): value is Track {
    if (typeof value !== "object" || value === null) return false

    const fields: readonly (keyof Track)[] = ["id", "title", "artist", "imageUrl", "embedUrl"]
    const candidate = value as Record<string, unknown>

    return fields.every((field) => typeof candidate[field] === "string")
}
