const SERVER_KEY = 'fc_server_url'
const CACHE_KEY  = 'fc_cache'

export function getServerUrl() {
  return (localStorage.getItem(SERVER_KEY) || '').replace(/\/$/, '')
}

export function setServerUrl(url) {
  localStorage.setItem(SERVER_KEY, url.trim().replace(/\/$/, ''))
}

async function apiFetch(path) {
  const base = getServerUrl()
  const url = base ? `${base}${path}` : path
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchAll() {
  const [words, tags] = await Promise.all([
    apiFetch('/api/words'),
    apiFetch('/api/tags'),
  ])
  return { words, tags }
}

export function saveCache(words, tags) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ words, tags, ts: Date.now() }))
  } catch (e) {
    console.warn('Cache write failed:', e)
  }
}

export function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
  } catch { return null }
}
