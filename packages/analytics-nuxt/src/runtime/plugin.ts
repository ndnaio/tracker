import { init, client, type NdnaOptions } from '@ndna/analytics'
import { vNdna } from '@ndna/analytics/vue'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'

export default defineNuxtPlugin({
  name: 'ndna-analytics',
  setup(nuxtApp) {
    const config = useRuntimeConfig().public.ndnaAnalytics as (Partial<NdnaOptions> & { enabled?: boolean }) | undefined
    // Registered on the server too, so SSR can render templates using v-ndna.
    nuxtApp.vueApp.directive('ndna', vNdna)
    if (!import.meta.client) {
      // init() is a no-op without a window; nothing to do during SSR.
    } else if (config?.enabled !== false && config?.site) {
      init(config as NdnaOptions)
    } else if (import.meta.dev && config?.enabled !== false) {
      console.warn('[@ndna/analytics-nuxt] Set `ndnaAnalytics.site` (or NUXT_PUBLIC_NDNA_ANALYTICS_SITE) to enable tracking.')
    }
    return { provide: { ndna: client } }
  },
})
