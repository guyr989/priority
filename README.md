# Sound Search

**Live app: https://priority-self.vercel.app/**

Search a library of tracks, page through the results, play one, and come back
later to the searches you already made. Built for the Priority Retail front end
exam with React 19, TypeScript in strict mode, Vite, and plain CSS Modules. No
UI kit, no state library, no HTTP client — `fetch` only.

## Run it

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run test       # Vitest, unit and integration
npm run typecheck  # tsc, strict, no any
npm run lint       # eslint
npm run build      # production bundle
```

## How it is put together

```
src/
  api/        the only place that knows the data source is Mixcloud
  domain/     types and pure logic: paging cursors, history rules
  storage/    a two-method Store contract plus a localStorage implementation
  hooks/      state orchestration, given the provider and the store
  components/ presentational only: props in, events out
```

The rule that shapes everything: each layer only knows the one beneath it, and
the vendor's name never leaves `src/api/`. `main.tsx` is the only file that
picks a concrete provider and a concrete store; `App` receives both as props.
Swapping Mixcloud for another service means writing one adapter that satisfies
`SoundProvider` and changing one export line in `src/api/index.ts` — no
component and no hook changes.

`domain/` imports nothing from React or from `api/`, which is why the paging
state machine and the history rules can be tested as plain functions.

## Trade-offs

**Cursor paging, never offsets.** The state machine stores the `next` and
`previous` cursors the API returned and hands them back untouched. Prev exists
only when the API offers it, and Next is disabled the moment a page comes back
without a next cursor. The cost: no jump-to-page, because a cursor API has no
page numbers to jump to.

**One request per navigation.** Moving a page clears both cursors until the new
page lands, so the buttons disable themselves while a request is in flight and
rapid clicking cannot skip or interleave pages. A request token guarantees a
move always refetches, even if the provider hands back the cursor it is already
on.

**Typing is debounced, clicking is not.** The 300ms debounce applies only when
starting a fresh query. Cursor moves fire immediately, because a click is a
decision, not a keystroke.

**History records searches that found something.** A term is stored once results
come back, so failed and half-typed searches stay out of the list. If a new term
continues the newest entry — "ade" then "adele" — the fragment is replaced, which
keeps live search from filling all five slots with one word.

**Cursors are checked before they are followed.** A cursor is a URL the API
chose, and it is used verbatim as the next request, so the adapter rejects any
cursor that leaves the API's own origin.
