import type { LayoutId, PaletteId } from '../domain/appearance'

/**
 * Every word the app shows, in one place. Components import from here instead
 * of holding literals, so a second locale is a second file and a lookup rather
 * than a sweep through the whole component tree.
 *
 * Anything that varies with data is a function, not a template left at the
 * call site — word order is the first thing translation changes, and a
 * function is the only shape that lets a locale move it.
 *
 * This module imports nothing but types. It is not a layer: no component
 * behaviour depends on it, and swapping it out changes only what is read.
 */
export const strings = {
  appName: 'Sound search',

  search: {
    region: 'Search',
    label: 'Search tracks',
    placeholder: 'Artist, show, or track',
    submit: 'Search',
    /** Offered on a first visit, when there is no history to offer instead. */
    starters: ['Boiler Room', 'NTS Radio', 'Rinse FM', 'Jazz', 'Techno', 'Disco', 'Afrobeat', 'Lo-fi'],
  },

  history: {
    heading: 'History',
    forget: (term: string) => `Remove ${term} from history`,
  },

  results: {
    region: 'Results',
    pages: 'Result pages',
    previous: 'Previous',
    next: 'Next',
    /** The control names the view you are about to get, not the one you have. */
    toList: 'List',
    toGrid: 'Grid',

    idle: 'Type a name and start digging.',
    loading: 'Digging',
    empty: 'Nothing under that name. Try fewer words.',
    error: 'That search did not land. Check your connection, then try again.',
    retry: 'Try again',
  },

  /** Read aloud, never seen. Kept apart from the copy above for that reason. */
  announce: {
    searching: 'Searching',
    nothingFound: 'Nothing found',
    ready: (count: number) => `${count} ${count === 1 ? 'result' : 'results'} ready`,
  },

  sleeve: {
    heading: 'Selected track',
    cover: (title: string, artist: string) => `${title} by ${artist}`,
    play: (title: string, artist: string) => `Play ${title} by ${artist}`,
  },

  player: {
    region: 'Player',
    frameTitle: (title: string) => `Player for ${title}`,
    close: 'Close the player',
    on: 'On the page',
    off: 'Off',
  },

  settings: {
    trigger: 'Settings',
    colour: 'Colour',
    layout: 'Layout',
  },

  palettes: {
    studio: { name: 'Studio', note: 'Light panels, violet accent. Follows your system.' },
    desk: { name: 'Desk', note: 'Low light, blue-black, a red record lamp.' },
    cinema: { name: 'Cinema', note: 'The cover fills the room behind the page.' },
    daylight: { name: 'Daylight', note: 'Cool paper under a bright window.' },
  } satisfies Record<PaletteId, { name: string; note: string }>,

  layouts: {
    side: { name: 'Sidebar', note: 'Search leads, the sleeve keeps a column beside it.' },
    stack: { name: 'Stacked', note: 'One narrow column, the sleeve below the search.' },
    banner: { name: 'Banner', note: 'Full width, the sleeve laid across.' },
    row: { name: 'Row', note: 'Search, results and sleeve in a single row.' },
  } satisfies Record<LayoutId, { name: string; note: string }>,
} as const
