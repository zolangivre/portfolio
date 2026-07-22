/**
 * Bridges a hash-link click to the destination page's mount, for
 * cross-page hash navigation (e.g. from /journal, clicking a nav item that
 * points back to /#projects). Reading `window.location.hash` on the new
 * page's mount is unreliable — it races against exactly when Next.js's
 * router applies the hash portion of the URL, which isn't guaranteed to
 * happen before the destination route's own effects run. Recording the
 * intended hash at click time, before navigation starts, removes that race
 * entirely: the destination consumes a value we set ourselves instead of
 * guessing whether the browser/router has caught up yet.
 */
let pendingHash: string | null = null

export function setPendingScrollHash(hash: string) {
  pendingHash = hash
}

export function consumePendingScrollHash(): string | null {
  const hash = pendingHash
  pendingHash = null

  return hash
}
