import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { module: 'src/module.ts' },
    format: ['esm'],
    dts: true,
    target: 'node18',
    external: ['@nuxt/kit', '@nuxt/schema', 'defu', '@ndna/analytics'],
  },
  // Runtime files are loaded by Nuxt's bundler, so they are transpiled as-is
  // (no bundling) and keep their `#app` / `@ndna/analytics` imports.
  {
    entry: ['src/runtime/plugin.ts', 'src/runtime/composables.ts'],
    outDir: 'dist/runtime',
    format: ['esm'],
    bundle: false,
    target: 'es2020',
  },
])
