# ndna analytics tracker

Cookieless, privacy-first analytics for [analytics.ndna.io](https://analytics.ndna.io). ~1.5 KB.

## Install

```bash
npm i @ndna/analytics
```

```ts
import { init, track } from '@ndna/analytics'

init({ site: 'YOUR_SITE_ID' })
track('Signup')
```

Vue: `@ndna/analytics/vue` · React / Next.js: `@ndna/analytics/react` · Nuxt: [`@ndna/analytics-nuxt`](packages/analytics-nuxt)

Full docs: [packages/analytics](packages/analytics)

## License

MIT
