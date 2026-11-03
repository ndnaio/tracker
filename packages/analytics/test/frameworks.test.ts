import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, withDirectives } from 'vue'
import { createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { destroy } from '../src/index'
import { NdnaAnalytics as VuePlugin, useNdna as useVueNdna, vNdna } from '../src/vue'
import { NdnaAnalytics as ReactNdna } from '../src/react'

let events: string[] = []

beforeEach(() => {
  events = []
  window.history.replaceState({}, '', '/')
  Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true })
  window.fetch = vi.fn((_url: string, init?: { body?: string }) => {
    events.push(JSON.parse(init?.body ?? '{}').e)
    return Promise.resolve({ ok: true } as Response)
  }) as unknown as typeof fetch
  document.body.innerHTML = '<div id="app"></div>'
})

afterEach(() => {
  destroy()
  delete window.ndna
})

const opts = { site: 'test-site', allowLocalhost: true }

describe('vue', () => {
  it('installs, tracks pageview, exposes $ndna and v-ndna', async () => {
    let fromComposable: ReturnType<typeof useVueNdna> | undefined
    const App = defineComponent({
      setup() {
        fromComposable = useVueNdna()
        return () => withDirectives(h('button', { id: 'b' }, 'Go'), [[vNdna, 'Signup']])
      },
    })
    const app = createApp(App)
    app.use(VuePlugin, opts)
    app.mount('#app')
    await nextTick()
    expect(app.config.globalProperties.$ndna.track).toBeTypeOf('function')
    document.getElementById('b')!.click()
    fromComposable!.track('Manual')
    expect(events).toEqual(['pageview', 'Signup', 'Manual'])
    app.unmount()
  })
})

describe('react', () => {
  it('initialises once, even in StrictMode', async () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const root = createRoot(document.getElementById('app')!)
    await act(async () => {
      root.render(createElement(StrictMode, null, createElement(ReactNdna, opts)))
    })
    expect(events).toEqual(['pageview'])
    act(() => root.unmount())
  })
})
