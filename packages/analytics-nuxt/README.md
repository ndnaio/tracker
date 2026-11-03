# @ndna/analytics-nuxt

Nuxt module for [`@ndna/analytics`](https://github.com/ndnaio/tracker/tree/main/packages/analytics): cookieless, privacy-first analytics for personal pages. ~1.5 KB. Data goes to [ndna analytics](https://analytics.ndna.io).

```bash
npm i @ndna/analytics-nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ndna/analytics-nuxt'],
  ndnaAnalytics: {
    site: 'YOUR_SITE_ID',
  },
})
```

Pageviews, including client-side navigations, are tracked automatically. Nothing runs on the server.

## Custom events

```vue
<script setup lang="ts">
const { track } = useNdna() // auto-imported
</script>

<template>
  <button v-ndna="'Signup'">Sign up</button>
  <button @click="track('Upgrade')">Upgrade</button>
</template>
```

`useNuxtApp().$ndna.track('Event')` works too.

## Options

All [`@ndna/analytics` options](https://github.com/ndnaio/tracker/tree/main/packages/analytics#options) (`site`, `host`, `api`, `auto`, `hash`, `allowLocalhost`) plus:

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Turn tracking off, e.g. for preview deployments. |

Options live in public runtime config, so you can set them per environment without rebuilding:

```bash
NUXT_PUBLIC_NDNA_ANALYTICS_SITE=abc123
NUXT_PUBLIC_NDNA_ANALYTICS_ENABLED=false
```

## License

MIT
