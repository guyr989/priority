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

**The flight is native.** The result that flies into the sleeve is animated with
the browser's Web Animations API — no animation library. Browsers that cannot
animate, and readers who have asked their system for reduced motion, get the
swap with no flight at all.

## Known trade-offs

- A search is remembered once it returns results, so a term that found nothing
  never reaches the list. Deliberate, but it means the history records what
  worked rather than everything typed.
- Previous is offered only when the provider sends a previous cursor. There is
  no locally kept back-stack, so paging history cannot drift, but it also cannot
  outrun what the API supports.
- The embedded player is the provider's own widget, so its look is theirs, not
  mine.
