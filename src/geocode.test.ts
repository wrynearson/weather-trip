import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchLocations } from './geocode'

// searchLocations debounces by 300ms before firing the real fetch, so every
// test advances fake timers past that window before asserting on the result.
const DEBOUNCE_MS = 300

describe('searchLocations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('resolves [] for a blank query without touching fetch', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await expect(searchLocations('   ')).resolves.toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('resolves with mapped results on a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              name: 'Springfield',
              display_name: 'Springfield, Illinois, USA',
              lat: '39.8',
              lon: '-89.6',
              address: { city: 'Springfield', state: 'Illinois', country: 'United States' },
            },
          ]),
      }),
    )

    const promise = searchLocations('springfield')
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    await expect(promise).resolves.toEqual([
      { name: 'Springfield', region: 'Illinois, United States', lat: 39.8, lon: -89.6 },
    ])
  })

  it('rejects (instead of resolving []) when the response is a non-2xx status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))

    // Subscribe via expect().rejects before advancing timers, so the
    // rejection handler is attached before the rejection happens — otherwise
    // vitest reports it as an unhandled rejection even though it's expected.
    const promise = searchLocations('rate limited city')
    const assertion = expect(promise).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
    await assertion
  })

  it('rejects (instead of resolving []) on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const promise = searchLocations('offline city')
    const assertion = expect(promise).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
    await assertion
  })

  it('never settles a call superseded by a newer one (no error surfaced)', async () => {
    const fetchMock = vi
      .fn()
      // The first call's underlying fetch never resolves on its own — it
      // only gets abort()ed by the second call, matching a real in-flight
      // request that gets superseded.
      .mockImplementationOnce(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const err = new DOMException('aborted', 'AbortError')
              reject(err)
            })
          }),
      )
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    vi.stubGlobal('fetch', fetchMock)

    const first = searchLocations('a')
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    const settled = { value: false }
    first.then(
      () => (settled.value = true),
      () => (settled.value = true),
    )

    const second = searchLocations('ab')
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
    await expect(second).resolves.toEqual([])

    // Give the first promise's callbacks a chance to run, if they were
    // ever going to.
    await Promise.resolve()
    await Promise.resolve()
    expect(settled.value).toBe(false)
  })
})
