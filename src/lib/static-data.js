// Vite bundles all data/*.json at build time — no server needed at runtime
const modules = import.meta.glob('../../data/*.json', { eager: true })

let _words = null
let _tags  = null

export function getStaticWords() {
  if (_words) return _words
  _words = []
  for (const [filePath, mod] of Object.entries(modules)) {
    const category = filePath.split('/').pop().replace('.json', '')
    for (const w of mod.default) _words.push({ ...w, category })
  }
  return _words
}

export function getStaticTags() {
  if (_tags) return _tags
  const counts = {}
  for (const w of getStaticWords()) {
    for (const t of w.tags || []) counts[t] = (counts[t] || 0) + 1
  }
  _tags = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  return _tags
}
