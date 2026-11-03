import { client, type NdnaClient } from '@ndna/analytics'

/** Returns `{ track, pageview }`. Safe to call on the server (no-op). */
export function useNdna(): NdnaClient {
  return client
}
