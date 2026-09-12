import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = path.resolve(__dirname, '../data')
const DIST_DIR  = path.resolve(__dirname, '../dist')
const PORT = 3001

const app = express()
app.use(cors())
app.use(express.json())

function loadAll() {
  if (!fs.existsSync(DATA_DIR)) return []
  const words = []
  for (const file of fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))) {
    const category = file.replace('.json', '')
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'))
    data.forEach(w => words.push({ ...w, category }))
  }
  return words
}

// GET /api/words?tags=noun,verb  (OR logic)
app.get('/api/words', (req, res) => {
  const all = loadAll()
  const { tags } = req.query
  if (!tags) return res.json(all)
  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
  res.json(all.filter(w => tagList.some(t => w.tags.includes(t))))
})

// GET /api/tags  — returns [{name, count}]
app.get('/api/tags', (req, res) => {
  const counts = {}
  for (const w of loadAll()) {
    for (const t of w.tags) counts[t] = (counts[t] || 0) + 1
  }
  res.json(
    Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  )
})

// POST /api/words  — { category, word, pronunciation, senses, tags, note }
app.post('/api/words', (req, res) => {
  const { category, ...wordData } = req.body
  if (!category || !wordData.word) return res.status(400).json({ error: 'category and word required' })

  const filePath = path.join(DATA_DIR, `${category}.json`)
  const words = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : []

  // Prevent duplicates
  if (words.some(w => w.word.toLowerCase() === wordData.word.toLowerCase())) {
    return res.status(409).json({ error: 'word already exists in this category' })
  }
  words.push(wordData)
  fs.writeFileSync(filePath, JSON.stringify(words, null, 2), 'utf-8')
  res.json({ success: true })
})

// PUT /api/words/:word  — update a word (patch fields)
app.put('/api/words/:word', (req, res) => {
  const { category, ...updates } = req.body
  if (!category) return res.status(400).json({ error: 'category required' })

  const filePath = path.join(DATA_DIR, `${category}.json`)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'category not found' })

  const words = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const idx = words.findIndex(w => w.word.toLowerCase() === req.params.word.toLowerCase())
  if (idx === -1) return res.status(404).json({ error: 'word not found' })

  words[idx] = { ...words[idx], ...updates }
  fs.writeFileSync(filePath, JSON.stringify(words, null, 2), 'utf-8')
  res.json({ success: true })
})

// Serve built frontend in production
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (_, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
}

function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces) {
      if (i.family === 'IPv4' && !i.internal) return i.address
    }
  }
  return 'localhost'
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server: http://localhost:${PORT}`)
  console.log(`Mạng LAN:  http://${getLocalIP()}:${PORT}`)
})
