/*!
 * @ndna/analytics — privacy-first, cookieless tracker for ndna analytics.
 * Sends no cookies, no localStorage, no visitor/device identifiers and never
 * the full URL or referrer. Respects Do-Not-Track.
 */

export interface NdnaOptions {
  /** Site id from the ndna analytics dashboard. */
  site: string
  /** Analytics host. Default: `https://analytics.ndna.io`. */
  host?: string
  /** Full collection endpoint. Overrides `host`. Default: `<host>/api/event`. */
  api?: string
  /** Track pageviews automatically (initial load + History API navigation). Default: `true`. */
  auto?: boolean
  /** Treat `#hash` changes as pageviews (hash-based routing). Default: `false`. */
  hash?: boolean
  /** Also send events from localhost / 127.0.0.1 / [::1] / *.local. Default: `false`. */
  allowLocalhost?: boolean
}

/** Function installed on `window.ndna` — compatible with the `<script>` tracker. */
export type NdnaFunction = (name: string) => void

export interface NdnaClient {
  /** Send a custom event, e.g. `track('Signup')`. */
  track: (name: string) => void
  /** Send a pageview for the current location (use with `auto: false`). */
  pageview: () => void
}

declare global {
  interface Window {
    ndna?: NdnaFunction
    /** Calls queued before the tracker loaded, e.g. `(window.ndnaq = window.ndnaq || []).push(['Signup'])`. */
    ndnaq?: unknown[][]
  }
}

export const DEFAULT_HOST = 'https://analytics.ndna.io'

/** Payload accepted by `POST /api/event`. */
interface Payload {
  s: string
  p: string
  r: string
  e: string
  i: 0 | 1
  z: string
  us: string
  um: string
  uc: string
}

interface State {
  site: string
  api: string
  hash: boolean
  localhost: boolean
  lastPage?: string
  cleanup: (() => void)[]
}

const OWN = '__ndnaModule'

let state: State | null = null
let pending: string[] = []

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined'

/** A `window.ndna` installed by the `<script>` tag tracker (not by this module). */
function scriptTracker(): NdnaFunction | undefined {
  const fn = isBrowser() ? window.ndna : undefined
  return fn && !(fn as unknown as Record<string, unknown>)[OWN] ? fn : undefined
}

function ignored(s: State): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string }
  const win = window as Window & { doNotTrack?: string }
  if (nav.doNotTrack === '1' || win.doNotTrack === '1' || nav.msDoNotTrack === '1') return true
  if (location.protocol === 'file:') return true
  if (!s.localhost && /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)$/i.test(location.hostname)) return true
  if ((document.visibilityState as string) === 'prerender') return true
  return false
}

function send(s: State, name: string, isInitialPageview?: boolean): void {
  if (ignored(s)) return
  let referrerHost = ''
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''
  } catch {}
  const params = new URLSearchParams(location.search)
  let timezone = ''
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {}
  const payload: Payload = {
    s: s.site,
    // Never transmit the full URL or referrer: query strings may contain PII.
    p: location.pathname,
    r: referrerHost,
    e: name || 'pageview',
    // A SPA keeps document.referrer after client-side navigation. This flag
    // ensures only the document's initial pageview can count as an entry.
    i: isInitialPageview ? 1 : 0,
    z: timezone,
    us: params.get('utm_source') || params.get('ref') || '',
    um: params.get('utm_medium') || '',
    uc: params.get('utm_campaign') || '',
  }
  const body = JSON.stringify(payload)
  // text/plain keeps this a CORS "simple request" (no preflight).
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(s.api, new Blob([body], { type: 'text/plain' }))) return
  } catch {}
  try {
    fetch(s.api, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
    }).catch(() => {})
  } catch {}
}

function page(s: State): void {
  const key = location.pathname + location.search + (s.hash ? location.hash : '')
  if (key === s.lastPage) return // de-dupe repeated navigations to the same URL
  const isInitialPageview = s.lastPage === undefined
  s.lastPage = key
  send(s, 'pageview', isInitialPageview)
}

function listen(s: State): void {
  // Defer so the framework has updated location first.
  const onNav = () => setTimeout(() => state === s && page(s), 0)
  for (const type of ['pushState', 'replaceState'] as const) {
    const orig = history[type]
    if (!orig) continue
    const patched = function (this: History, ...args: Parameters<History['pushState']>) {
      const ret = orig.apply(this, args)
      onNav()
      return ret
    }
    history[type] = patched
    s.cleanup.push(() => {
      if (history[type] === patched) history[type] = orig
    })
  }
  window.addEventListener('popstate', onNav)
  s.cleanup.push(() => window.removeEventListener('popstate', onNav))
  if (s.hash) {
    window.addEventListener('hashchange', onNav)
    s.cleanup.push(() => window.removeEventListener('hashchange', onNav))
  }
}

/**
 * Start tracking. Safe to call during SSR (no-op) and more than once (later
 * calls are ignored until `destroy()`). If the `<script>` tracker is already on
 * the page, this defers to it instead of tracking twice.
 */
export function init(options: NdnaOptions): NdnaClient {
  if (!isBrowser() || state || scriptTracker()) return client
  if (!options || !options.site) {
    console.warn('[@ndna/analytics] `site` is required — tracking disabled.')
    return client
  }
  const host = (options.host || DEFAULT_HOST).replace(/\/+$/, '')
  const s: State = {
    site: options.site,
    api: options.api || host + '/api/event',
    hash: !!options.hash,
    localhost: !!options.allowLocalhost,
    cleanup: [],
  }
  state = s

  if (options.auto !== false) listen(s)

  // Expose the same global API as the <script> tracker, so `window.ndna('X')` works too.
  const global: NdnaFunction = (name) => track(name)
  ;(global as unknown as Record<string, unknown>)[OWN] = true
  const queue = window.ndnaq
  window.ndna = global
  s.cleanup.push(() => {
    if (window.ndna === global) delete window.ndna
  })
  if (queue && queue.length) {
    for (const args of queue) {
      try {
        track(String((args as unknown[])[0] ?? ''))
      } catch {}
    }
    queue.length = 0
  }
  const early = pending
  pending = []
  early.forEach((name) => send(s, name))

  if (options.auto !== false) {
    if ((document.visibilityState as string) === 'prerender') {
      const onVis = () => {
        if ((document.visibilityState as string) !== 'prerender') {
          document.removeEventListener('visibilitychange', onVis)
          if (state === s) page(s)
        }
      }
      document.addEventListener('visibilitychange', onVis)
      s.cleanup.push(() => document.removeEventListener('visibilitychange', onVis))
    } else {
      page(s)
    }
  }
  return client
}

/** Send a custom event. Calls made before `init()` are queued and sent on init. */
export function track(name: string): void {
  if (!isBrowser() || !name) return
  name = String(name)
  const external = scriptTracker()
  if (external) return external(name)
  if (state) send(state, name)
  else if (pending.length < 50) pending.push(name)
}

/** Send a pageview for the current URL (for `auto: false` or custom routers). */
export function pageview(): void {
  if (state) page(state)
}

/** Stop tracking: restore History API methods, remove listeners and `window.ndna`. */
export function destroy(): void {
  if (!state) return
  state.cleanup.forEach((fn) => fn())
  state = null
  pending = []
}

export const client: NdnaClient = { track, pageview }
