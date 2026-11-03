import { defineConfig } from 'tsup'

const shared = {
  format: ['esm', 'cjs'] as const,
  dts: true,
  target: 'es2018',
  minify: true,
  sourcemap: false,
  external: ['vue', 'react', '@ndna/analytics'],
}

export default defineConfig([
  { ...shared, entry: { index: 'src/index.ts', vue: 'src/vue.ts' } },
  // Separate build so the React entry keeps its 'use client' directive (Next.js app router).
  { ...shared, entry: { react: 'src/react.ts' }, banner: { js: "'use client';" } },
])
