# @ndna/analytics

Cookieless, privacy-first analytics for personal pages. ~1.5 KB. Data goes to [ndna analytics](https://analytics.ndna.io).

- **~1.5 KB gzipped**, zero dependencies, fully typed
- **No cookies, no localStorage, no visitor IDs, no fingerprinting** — no consent banner needed
- Sends only the path, referrer domain, timezone and UTM values (`utm_source` falls back to `?ref=`) — never full URLs or query strings
- Respects **Do-Not-Track**
- SPA-aware: tracks History API navigation (Vue Router, React Router, Next.js…) automatically
- SSR-safe: every call is a no-op on the server
- Bindings for **Vue**, **React** and **Nuxt** ([`@ndna/analytics-nuxt`](https://github.com/ndnaio/tracker/tree/main/packages/analytics-nuxt))

```bash
npm i @ndna/analytics
```

## Vanilla JS / TypeScript

```ts
import { init, track } from '@ndna/analytics'

init({ site: 'YOUR_SITE_ID' })

track('Signup')
```

## Vue

```ts
import { createApp } from 'vue'
import { NdnaAnalytics } from '@ndna/analytics/vue'

createApp(App).use(NdnaAnalytics, { site: 'YOUR_SITE_ID' }).mount('#app')
```

```vue
<script setup lang="ts">
import { useNdna } from '@ndna/analytics/vue'
const { track } = useNdna()
</script>

<template>
  <button v-ndna="'Signup'">Sign up</button>          <!-- tracks on click -->
  <form v-ndna:submit="'Contact'">…</form>             <!-- any DOM event -->
  <button @click="track('Upgrade')">Upgrade</button>
</template>
```

`$ndna` is also available in templates.

## React / Next.js

```tsx
// app/layout.tsx (Next.js app router) — or your root component
import { NdnaAnalytics } from '@ndna/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <NdnaAnalytics site="YOUR_SITE_ID" />
      </body>
    </html>
  )
}
```

```tsx
import { useNdna } from '@ndna/analytics/react'

function SignupButton() {
  const { track } = useNdna()
  return <button onClick={() => track('Signup')}>Sign up</button>
}
```

## Nuxt

```bash
npm i @ndna/analytics-nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ndna/analytics-nuxt'],
  ndnaAnalytics: { site: 'YOUR_SITE_ID' },
})
```

See [`@ndna/analytics-nuxt`](https://github.com/ndnaio/tracker/tree/main/packages/analytics-nuxt).

## Options

| Option | Default | Description |
|---|---|---|
| `site` | — | **Required.** Site ID from the dashboard. |
| `host` | `https://analytics.ndna.io` | Analytics host (for self-hosting). |
| `api` | `<host>/api/event` | Full collection endpoint; overrides `host`. |
| `auto` | `true` | Track pageviews automatically. Set `false` and call `pageview()` yourself. |
| `hash` | `false` | Count `#hash` changes as pageviews (hash routers). |
| `allowLocalhost` | `false` | Also send events from `localhost`, `127.0.0.1`, `[::1]` and `*.local`. |

## API

| Function | Description |
|---|---|
| `init(options)` | Start tracking. Idempotent; no-op during SSR. |
| `track(name)` | Send a custom event. Calls made before `init` are queued. |
| `pageview()` | Send a pageview for the current URL. |
| `destroy()` | Stop tracking and restore the History API. |

`init` also installs `window.ndna(name)`, so it works the same as the `<script>` tag snippet. If the script tag is already on the page, `@ndna/analytics` uses that instead of tracking twice.

## Script tag

Prefer no build step? Use the snippet from your dashboard:

```html
<script defer data-site="YOUR_SITE_ID" src="https://analytics.ndna.io/tracker.js"></script>
```

## License

MIT
