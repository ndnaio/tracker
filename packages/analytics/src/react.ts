import { useEffect } from 'react'
import { init, client, type NdnaClient, type NdnaOptions } from '@ndna/analytics'

export type { NdnaClient, NdnaOptions } from '@ndna/analytics'
export { track, pageview, destroy } from '@ndna/analytics'

/**
 * Drop once into your root layout: `<NdnaAnalytics site="YOUR_SITE_ID" />`.
 * Renders nothing. Works with Next.js (app & pages router), Remix, Vite, etc.
 */
export function NdnaAnalytics(props: NdnaOptions): null {
  useNdnaAnalytics(props)
  return null
}

/** Hook alternative to `<NdnaAnalytics />`. Initialises once on mount. */
export function useNdnaAnalytics(options: NdnaOptions): NdnaClient {
  useEffect(() => {
    init(options)
    // Intentionally not destroyed on unmount: StrictMode double-mounts would
    // otherwise record the initial pageview twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return client
}

/** Returns `{ track, pageview }`. */
export function useNdna(): NdnaClient {
  return client
}

export default NdnaAnalytics
