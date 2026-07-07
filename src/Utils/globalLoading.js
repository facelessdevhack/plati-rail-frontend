/**
 * Tiny pub-sub counter for in-flight HTTP requests.
 *
 * The axios interceptors in `axiosClient.js` call `startRequest()` before
 * each request and `endRequest()` in both the response and error paths.
 * `<App>` mounts a single <GlobalLoader visible={useGlobalLoading() > 0} />
 * that reacts to the counter.
 *
 * Opt-out: set `config.silent = true` on an axios request to skip the
 * counter entirely (e.g. dealer-autocomplete typing, background polling).
 */

import { useEffect, useState } from 'react'

let count = 0
const listeners = new Set()

const notify = () => {
  for (const fn of listeners) fn(count)
}

export const startRequest = () => {
  count += 1
  notify()
}

export const endRequest = () => {
  // Clamp at zero — an interceptor error before response arrives should
  // never leave the counter "stuck" above the actual inflight count.
  count = Math.max(0, count - 1)
  notify()
}

export const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const useGlobalLoading = () => {
  const [n, setN] = useState(count)
  useEffect(() => subscribe(setN), [])
  return n
}
