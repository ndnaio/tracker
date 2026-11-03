// Types for Nuxt's virtual imports, resolved by the consumer app at build time.
declare module '#app' {
  import type { App } from 'vue'
  export function defineNuxtPlugin<T>(plugin: { name?: string; setup: (nuxtApp: { vueApp: App }) => T }): unknown
  export function useRuntimeConfig(): { public: Record<string, unknown> }
}

interface ImportMeta {
  dev?: boolean
  client?: boolean
}
