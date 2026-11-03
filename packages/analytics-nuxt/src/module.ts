import { addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { NdnaClient, NdnaOptions } from '@ndna/analytics'

export interface ModuleOptions extends Partial<NdnaOptions> {
  /** Disable tracking entirely (e.g. in preview environments). Default: `true`. */
  enabled?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@ndna/analytics-nuxt',
    configKey: 'ndnaAnalytics',
    compatibility: { nuxt: '>=3.15.0' },
  },
  // Every key needs a default: Nuxt only lets env vars override runtime config
  // keys that exist at build time. Empty strings fall back to the core defaults.
  defaults: {
    enabled: true,
    site: '',
    host: '',
    api: '',
    auto: true,
    hash: false,
    allowLocalhost: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Exposed via public runtime config, so every option can be overridden at
    // runtime with env vars, e.g. NUXT_PUBLIC_NDNA_ANALYTICS_SITE=abc123.
    nuxt.options.runtimeConfig.public.ndnaAnalytics = defu(
      nuxt.options.runtimeConfig.public.ndnaAnalytics as ModuleOptions | undefined,
      options,
    )

    nuxt.options.build.transpile.push('@ndna/analytics')

    addPlugin(resolver.resolve('./runtime/plugin'))
    addImports({ name: 'useNdna', from: resolver.resolve('./runtime/composables') })
  },
})

declare module '@nuxt/schema' {
  interface NuxtConfig {
    ndnaAnalytics?: ModuleOptions
  }
  interface NuxtOptions {
    ndnaAnalytics?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    ndnaAnalytics?: ModuleOptions
  }
}

declare module '#app' {
  interface NuxtApp {
    $ndna: NdnaClient
  }
}
