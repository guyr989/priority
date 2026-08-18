import type { Page } from "./page";
import type { Track } from "./track";

export interface SoundProvider {
    search(query: string, cursor: string | null, signal: AbortSignal): Promise<Page<Track>>;
}