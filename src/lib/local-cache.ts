type CacheEntry<T> = {
  value: T
  storedAt: number
}

export function readLocalCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as CacheEntry<T>
  } catch {
    return null
  }
}

export function writeLocalCache<T>(key: string, value: T): void {
  try {
    const entry: CacheEntry<T> = { value, storedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Storage full or unavailable (private browsing, quota exceeded) — caching
    // is a nice-to-have here, so just skip it rather than breaking the fetch.
  }
}
