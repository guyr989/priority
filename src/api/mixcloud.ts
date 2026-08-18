import type { Page } from "../domain/page";
import type { SoundProvider } from "../domain/soundProvider";
import type { Track } from "../domain/track";

const SEARCH_URL = "https://api.mixcloud.com/search/";
const API_ORIGIN = new URL(SEARCH_URL).origin;
const EMBED_URL = "https://player-widget.mixcloud.com/widget/iframe/";
const PAGE_SIZE = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function readString(source: Record<string, unknown>, key: string): string | null {
    const value = source[key];
    return typeof value === "string" ? value : null;
}

function toTrack(raw: unknown): Track | null {
    if (!isRecord(raw)) return null;

    const key = readString(raw, "key");
    const name = readString(raw, "name");
    if (key === null || name === null) return null;

    const user = isRecord(raw.user) ? raw.user : null;
    const pictures = isRecord(raw.pictures) ? raw.pictures : null;

    return {
        id: key,
        title: name,
        artist: (user && readString(user, "name")) ?? "Unknown artist",
        imageUrl: (pictures && (readString(pictures, "large") ?? readString(pictures, "medium"))) ?? "",
        embedUrl: `${EMBED_URL}?feed=${encodeURIComponent(key)}`,
    };
}

function toPage(body: unknown): Page<Track> {
    if (!isRecord(body)) {
        throw new Error("Unexpected response shape");
    }

    const data = Array.isArray(body.data) ? body.data : [];
    const paging = isRecord(body.paging) ? body.paging : null;

    return {
        items: data.map(toTrack).filter((track): track is Track => track !== null),
        nextCursor: paging === null ? null : readString(paging, "next"),
        prevCursor: paging === null ? null : readString(paging, "previous"),
    };
}

function buildUrl(query: string, cursor: string | null): string {
    if (cursor !== null) {
        const target = new URL(cursor, SEARCH_URL);
        if (target.origin !== API_ORIGIN) {
            throw new Error("Refusing to follow a cursor to another host");
        }
        return target.toString();
    }

    const url = new URL(SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("type", "cloudcast");
    url.searchParams.set("limit", String(PAGE_SIZE));
    return url.toString();
}

export const soundProvider: SoundProvider = {
    async search(query: string, cursor: string | null, signal: AbortSignal): Promise<Page<Track>> {
        const response = await fetch(buildUrl(query, cursor), { signal });

        if (!response.ok) {
            throw new Error(`Search failed (${response.status})`);
        }

        const body: unknown = await response.json();
        return toPage(body);
    },
};
