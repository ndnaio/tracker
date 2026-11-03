import type { App, Directive, DirectiveBinding } from 'vue'
import { init, client, type NdnaClient, type NdnaOptions } from '@ndna/analytics'

export type { NdnaClient, NdnaOptions } from '@ndna/analytics'
export { track, pageview, destroy } from '@ndna/analytics'

type El = HTMLElement & { __ndna?: { type: string; handler: () => void } }

function bind(el: El, binding: DirectiveBinding<string>) {
  unbind(el)
  const name = binding.value
  if (!name) return
  const type = binding.arg || 'click'
  const handler = () => client.track(name)
  el.addEventListener(type, handler)
  el.__ndna = { type, handler }
}

function unbind(el: El) {
  if (!el.__ndna) return
  el.removeEventListener(el.__ndna.type, el.__ndna.handler)
  delete el.__ndna
}

/**
 * Track an event when the element is interacted with.
 * `<button v-ndna="'Signup'">` (click) or `<form v-ndna:submit="'Contact'">`.
 */
export const vNdna: Directive<El, string> = {
  mounted: bind,
  updated(el, binding) {
    if (binding.value !== binding.oldValue) bind(el, binding)
  },
  beforeUnmount: unbind,
  getSSRProps: () => ({}),
}

/**
 * Vue plugin: `app.use(NdnaAnalytics, { site: 'YOUR_SITE_ID' })`.
 * Registers the `v-ndna` directive and `$ndna` global property.
 */
export const NdnaAnalytics = {
  install(app: App, options: NdnaOptions) {
    init(options)
    app.config.globalProperties.$ndna = client
    app.directive('ndna', vNdna)
  },
}

/** Composable returning `{ track, pageview }`. */
export function useNdna(): NdnaClient {
  return client
}

export default NdnaAnalytics

declare module 'vue' {
  interface ComponentCustomProperties {
    $ndna: NdnaClient
  }
}
