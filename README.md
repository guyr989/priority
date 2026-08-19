**Live app: https://priority-self.vercel.app/**

# Sound search

Search a library of DJ sets and radio shows, page through the results six at a
time, send one to the sleeve, and play it. Your last five searches are waiting
the next time you open it.

Built for the Priority Retail front end exam with React 19, TypeScript in strict
mode, Vite, Vitest, and plain CSS Modules. No UI kit, no state library, no HTTP
client — `fetch` only.

## Run it

```bash
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run test` | 74 unit and integration tests |
| `npm run typecheck` | `tsc -b`, strict, `noUncheckedIndexedAccess`, zero `any` |
| `npm run lint` | eslint, including the React hooks rules |
| `npm run build` | production bundle |

## How it is put together

```
src/
  api/         the only layer that knows the data source is Mixcloud
  domain/      types and pure logic: paging cursors, history rules, view mode
  storage/     a Store contract plus its localStorage implementation
  hooks/       state orchestration, handed the provider and the store
  components/  presentational only: props in, events out
  main.tsx     the composition root, and the only file that picks concretes
```

Each layer only knows the one beneath it. `domain/` imports nothing from React,
from `api/`, or from `storage/`, which is why the paging state machine and the
history rules are tested as plain functions with no renderer involved.
`components/` never reaches for data; everything arrives as props.

`main.tsx` is where the app is assembled: it constructs the Mixcloud adapter and
three localStorage-backed stores — recent searches, list-or-tile, and the last
cover shown — and passes them into `App`. Nothing below that
line names a vendor — `grep -ri mixcloud src/ --exclude-dir=api` comes back
empty.

**Swapping the data source really is one file.** I wrote a second adapter
against the same `SoundProvider` interface — an in-memory library with numeric
offsets instead of Mixcloud's URL cursors — pointed `src/api/index.ts` at it, and
ran typecheck, lint, the full test suite, and the build. Everything passed and
`git status` showed exactly one modified file, inside `src/api/`. Then I deleted
it. The App tests do the same thing permanently: they render the whole app
against a fake provider and fake stores.

## Decisions worth defending

**Cursors, never offsets.** The API hands back opaque `next` and `previous`
strings and the state machine stores them untouched; it cannot compute a cursor,
only carry one. Next disables itself the moment a page arrives without one. The
cost is that there is no jump-to-page, because a cursor API has no page numbers
to jump to. The gain is that paging cannot drift out of sync with the provider.

**One request per navigation, and stale answers can never win.** Every fetch is
debounced by 300ms, carries an `AbortController`, and is fenced by a per-effect
flag, so a response that arrives after its query has moved on is dropped rather
than rendered. Moving a page clears both cursors until the new page lands, which
disables the controls while a request is in flight — rapid clicking cannot
interleave pages. A request token makes sure a move always refetches, even if a
provider ever returned the cursor it was already on.

**Typing is debounced; clicking is not.** The debounce exists to collapse
keystrokes. A page click is a decision, so it fires immediately.

**History lives outside React.** The rules — newest first, no duplicates,
case-insensitive, capped at five, and a fragment replaced when the next term
continues it — are pure functions in `domain/history.ts`. React only holds the
result. That is what makes them testable without a DOM, and what lets the same
rules survive a change of storage or of framework.

**Storage is an interface, not a call.** Components and domain code never touch
`localStorage`. They are handed a `Store<T>` with `read` and `write`, validated
on the way in by a type guard, with every browser call wrapped so private mode
or a full quota degrades to "nothing stored" instead of an exception.

**A cursor is checked before it is followed.** The `next` value becomes the next
request URL verbatim, so the adapter rejects any cursor that leaves the API's own
origin.

**A look is one attribute, not a theme engine.** The appearance picker writes a
single `data-appearance` value on the document. Every palette, radius and
proportion for the four looks is a block of custom properties in `index.css`, and
the three layouts are tokens on the grid, so no component knows which look is on
and adding a fifth is CSS plus one entry in `domain/appearance.ts`. The picker
stays open after a choice on purpose: the looks are meant to be compared, and the
close it used to do could not fire when you re-picked the look you were already
on. Gallery carries no player, which is why it is never the default and never
what a first-time visitor sees — requirement 6 asks for the embed, so the look
that drops it says so on its own line in the list.

**Playing is what the player says, not what we clicked.** The search API reports
play counts, never whether this listener is playing, so the state comes from the
embed over its own postMessage API. `domain/playback.ts` states that as a plain
subscribe, so nothing under the api layer knows a vendor or an iframe exists, and
a provider that cannot report playback falls back to the click. Pressing pause on
the player's own transport stops our equaliser; the embed stays where it is.

**The flight is native.** The result that flies into the sleeve is animated with
the browser's Web Animations API — no animation library. Browsers that cannot
animate, and readers who have asked their system for reduced motion, get the
swap with no flight at all.

## Known trade-offs

- The app is exactly one viewport tall and the page itself never scrolls. The
  result list is the single region allowed to overflow, because a search field,
  six results, a sleeve and a player cannot be made to share a phone screen at a
  readable size. On a narrow window the sleeve lies down into a thumbnail beside
  its billing, and the list can be folded away; on a wide one it stays open,
  since there is room for it.
- The provider's transport sits in a bar fixed to the foot of the window rather
  than directly under the artwork. Requirement 6 asks that clicking the central
  image embeds the track below it and plays; the click, the artwork and the play
  control are all still on the image, and only the widget itself moved, because
  a track that scrolls out of reach behind a page of results is not a player
  anyone can use. The cover remains the flight target, so requirement 5 is
  untouched.
- The player is off on a first visit. One switch in the top bar turns it on and
  the answer is kept for the next visit. That is a deliberate choice, and it has
  a cost worth stating plainly: requirement 6 asks that clicking the artwork
  embeds the track and plays it, and someone opening the app for the first time
  has to press Player before the artwork becomes a play control. The switch sits
  in the top bar rather than behind a menu for exactly that reason.
- A search is remembered once it returns results, so a term that found nothing
  never reaches the list. Deliberate, but it means the history records what
  worked rather than everything typed.
- Previous is offered only when the provider sends a previous cursor. There is
  no locally kept back-stack, so paging history cannot drift, but it also cannot
  outrun what the API supports.
- The embedded player is the provider's own widget, so its look is theirs, not
  mine. A show with licensing restrictions prints their notice in their colours
  inside their iframe: cross-origin, so it cannot be restyled from here.
- The widget's own script is the one third-party request the app makes, loaded
  only when a player first appears. The typefaces are self-hosted for that
  reason; playback state is not available any other way.
- The widget library registers a window listener it never removes, so the adapter
  catches the registration and releases it on detach. If a future version
  registers asynchronously that release quietly stops working, which is the point
  at which owning the postMessage handshake becomes the better trade.
