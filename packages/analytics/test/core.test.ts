import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { destroy, init, pageview, track } from '../src/index'

interface Call {
  url: string
  body: Record<string, unknown>
}

let calls: Call[] = []

async function flush() {
  await new Promise((r) => setTimeout(r, 10))
}

beforeEach(() => {
  calls = []
  window.history.replaceState({}, '', '/')
  Object.defineProperty(navigator, 'doNotTrack', { value: null, configurable: true })
  Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true })
  window.fetch = vi.fn((url: string, init?: { body?: string }) => {
    calls.push({ url, body: JSON.parse(init?.body ?? '{}') })
    return Promise.resolve({ ok: true } as Response)
  }) as unknown as typeof fetch
})

afterEach(() => {
  destroy()
  delete window.ndna
  delete window.ndnaq
})

// happy-dom defaults to localhost, so most tests opt in via allowLocalhost.
const opts = { site: 'test-site', allowLocalhost: true }

describe('init', () => {
  it('sends an initial pageview to the default host with i=1', () => {
    init(opts)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe('https://analytics.ndna.io/api/event')
    expect(calls[0]!.body).toMatchObject({ s: 'test-site', e: 'pageview', i: 1, p: '/' })
  })

  it('respects host and api overrides', () => {
    init({ ...opts, host: 'https://stats.example.com/' })
    expect(calls[0]!.url).toBe('https://stats.example.com/api/event')
    destroy()
    init({ ...opts, api: 'https://x.test/collect' })
    expect(calls.at(-1)!.url).toBe('https://x.test/collect')
  })

  it('is idempotent', () => {
    init(opts)
    init(opts)
    expect(calls).toHaveLength(1)
  })

  it('ignores localhost unless allowLocalhost is set', () => {
    init({ site: 'test-site' })
    expect(calls).toHaveLength(0)
  })

  it('sends nothing when Do-Not-Track is on', () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })
    init(opts)
    track('Signup')
    expect(calls).toHaveLength(0)
  })

  it('does nothing without a site id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    init({ site: '' })
    expect(calls).toHaveLength(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('does not send pageviews with auto: false until pageview() is called', () => {
    init({ ...opts, auto: false })
    expect(calls).toHaveLength(0)
    pageview()
    expect(calls[0]!.body).toMatchObject({ e: 'pageview', i: 1 })
  })
})

describe('SPA navigation', () => {
  it('tracks pushState with i=0 and de-dupes the same URL', async () => {
    init(opts)
    window.history.pushState({}, '', '/about')
    await flush()
    window.history.replaceState({}, '', '/about')
    await flush()
    expect(calls).toHaveLength(2)
    expect(calls[1]!.body).toMatchObject({ p: '/about', i: 0 })
  })

  it('restores history methods on destroy', () => {
    const orig = window.history.pushState
    init(opts)
    expect(window.history.pushState).not.toBe(orig)
    destroy()
    expect(window.history.pushState).toBe(orig)
  })
})

describe('payload', () => {
  it('sends UTM params but never the query string', () => {
    window.history.replaceState({}, '', '/landing?utm_source=news&utm_medium=email&utm_campaign=launch&email=a@b.c')
    init(opts)
    expect(calls[0]!.body).toMatchObject({ p: '/landing', us: 'news', um: 'email', uc: 'launch' })
    expect(JSON.stringify(calls[0]!.body)).not.toContain('a@b.c')
  })

  it('maps ?ref= to utm_source', () => {
    window.history.replaceState({}, '', '/?ref=partner')
    init(opts)
    expect(calls[0]!.body.us).toBe('partner')
  })
})

describe('custom events', () => {
  it('tracks via track() and window.ndna()', () => {
    init(opts)
    track('Signup')
    window.ndna!('Purchase')
    expect(calls.map((c) => c.body.e)).toEqual(['pageview', 'Signup', 'Purchase'])
  })

  it('queues events tracked before init and from window.ndnaq', () => {
    track('Early')
    window.ndnaq = [['FromQueue']]
    init({ ...opts, auto: false })
    expect(calls.map((c) => c.body.e).sort()).toEqual(['Early', 'FromQueue'])
  })

  it('ignores empty names', () => {
    init({ ...opts, auto: false })
    track('')
    expect(calls).toHaveLength(0)
  })

  it('defers to the <script> tracker when it is already loaded', () => {
    const external = vi.fn()
    window.ndna = external
    init(opts)
    track('Signup')
    expect(external).toHaveBeenCalledWith('Signup')
    expect(calls).toHaveLength(0)
  })
})
