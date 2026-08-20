import type { SearchStatus } from '../hooks/useSearch'
import { strings } from '../i18n/strings'

/**
 * What the live region says about a search. Its own file because it is not a
 * component and the file that held it exports one: a module that exports both
 * cannot be hot-replaced, and the state of every result on the page went with
 * it on each edit.
 *
 * Called from App, not from Results: the live region has to be on the page
 * before it has anything to say, or a screen reader mounts the node and the
 * announcement in the same tick and reads neither.
 */
export function announcement(status: SearchStatus, count: number): string {
  if (status === 'loading') return strings.announce.searching
  if (status !== 'ready') return ''
  if (count === 0) return strings.announce.nothingFound
  return strings.announce.ready(count)
}
