import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = path.resolve(__dirname, '../../Words')
const OUTPUT_DIR = path.resolve(__dirname, '../data')

const FILE_TAGS = {
  'Danh từ hữu hình':               ['noun', 'concrete'],
  'Danh từ trừu tượng':             ['noun', 'abstract'],
  'Hành động hữu hình':             ['verb', 'concrete'],
  'Hành động trừu tượng':           ['verb', 'abstract'],
  'Tính từ miêu tả':                ['adjective'],
  'Tính từ & Trạng từ bổ nghĩa':    ['adjective', 'adverb'],
  'Tính cách, miêu tả về con người':['adjective'],
  'Cảm xúc & Cảm giác':            ['noun', 'abstract'],
  'Thành ngữ':                      ['phrase'],
  'Ẩm thực':                        ['noun', 'food'],
  'Động vật':                       ['noun', 'animal'],
  'Y học & Sinh học':               ['noun', 'medical'],
  'Khoa học':                       ['noun', 'science'],
  'Kinh doanh & Kinh tế':           ['noun', 'business'],
  'Chính trị':                      ['noun', 'politics'],
  'Quân sự':                        ['noun', 'military'],
  'Pháp luật':                      ['noun', 'law'],
  'Tôn giáo':                       ['noun', 'religion'],
  'Địa điểm & Địa lý':              ['noun', 'place'],
  'Giao thông':                     ['noun', 'transport'],
  'Ngành nghề & Công việc':         ['noun', 'work'],
  'Ngôn ngữ & Diễn đạt':           ['noun', 'language'],
  'Loại người':                     ['noun', 'person'],
  'Nông nghiệp':                    ['noun', 'agriculture'],
  'Quần áo & Thời trang':           ['noun', 'fashion'],
  'Sư phạm':                        ['noun', 'education'],
  'Sự vật':                         ['noun', 'concrete'],
  'Thể thao':                       ['noun', 'sport'],
  'Thời tiết & Hiện tượng tự nhiên':['noun', 'nature'],
  'Thực vật':                       ['noun', 'plant'],
  'Tổ chức':                        ['noun', 'organization'],
}

const POS_TAG_MAP = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' }

function parseEntry(entryText, fileTags) {
  const lines = entryText.split('\n').map(l => l.replace('\r', '').trim()).filter(Boolean)
  if (!lines.length) return null

  const firstLine = lines[0]
  const tabIdx = firstLine.indexOf('\t')
  if (tabIdx === -1) return null

  const termPart  = firstLine.slice(0, tabIdx).trim()
  const meaningRaw = firstLine.slice(tabIdx + 1).trim()
  const examples  = lines.filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())

  // Parse: "word /pron/ (pos, pos)" | "word (pos)" | "phrase" (idioms)
  let word, pronunciation = '', posString = ''
  const withPron = termPart.match(/^(.+?)\s+(\/[^/]+\/)\s+\(([^)]+)\)\s*$/)
  const withPos  = termPart.match(/^(.+?)\s+\(([^)]+)\)\s*$/)

  if (withPron) {
    word        = withPron[1].trim()
    pronunciation = withPron[2].trim()
    posString   = withPron[3].trim()
  } else if (withPos) {
    word      = withPos[1].trim()
    posString = withPos[2].trim()
  } else {
    word = termPart
  }

  const posList = posString
    ? posString.split(/,\s*/).map(p => p.trim()).filter(p => /^[a-z]+$/.test(p))
    : []

  // Split meanings on ";" for multi-pos entries
  const meanings = meaningRaw.split(/;\s*/).map(m => m.trim()).filter(Boolean)

  let senses
  if (posList.length === 0) {
    senses = [{ pos: 'phrase', meaning: meaningRaw, examples, synonyms: [] }]
  } else if (posList.length === 1) {
    senses = [{ pos: posList[0], meaning: meaningRaw, examples, synonyms: [] }]
  } else {
    senses = posList.map((pos, i) => ({
      pos,
      meaning: meanings[i] || meanings[0],
      examples: i === 0 ? examples : [],
      synonyms: [],
    }))
  }

  const posTags = [...new Set(posList.map(p => POS_TAG_MAP[p]).filter(Boolean))]
  const tags    = [...new Set([...fileTags, ...posTags])]

  return {
    word,
    pronunciation,
    senses,
    tags,
    note: '',
    needsEnrichment: posList.length > 1,
  }
}

function migrateFile(filename, fileTags) {
  const content = fs.readFileSync(path.join(SOURCE_DIR, filename), 'utf-8')
  const words = []
  for (const entry of content.split('---')) {
    try {
      const parsed = parseEntry(entry, fileTags)
      if (parsed?.word) words.push(parsed)
    } catch {
      // skip malformed entries
    }
  }
  return words
}

const SKIP = new Set(['Sentences.txt', 'Từ mới'])
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

let total = 0
for (const file of fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.txt') && !SKIP.has(f))) {
  const category = file.replace('.txt', '')
  const fileTags = FILE_TAGS[category] || []
  try {
    const words = migrateFile(file, fileTags)
    fs.writeFileSync(path.join(OUTPUT_DIR, `${category}.json`), JSON.stringify(words, null, 2), 'utf-8')
    console.log(`✓ ${category}: ${words.length} từ`)
    total += words.length
  } catch (e) {
    console.error(`✗ ${category}: ${e.message}`)
  }
}
console.log(`\nTổng cộng: ${total} từ`)
