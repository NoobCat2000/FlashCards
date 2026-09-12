import { useEffect, useState } from 'react'
import { loadCache } from '../lib/api.js'
import { getStaticWords, getStaticTags } from '../lib/static-data.js'
import Settings from './Settings.jsx'

const TAG_STYLE = {
  noun:         'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
  verb:         'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
  adjective:    'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/30',
  adverb:       'bg-violet-500/15 text-violet-300 border-violet-500/30 hover:bg-violet-500/30',
  phrase:       'bg-pink-500/15 text-pink-300 border-pink-500/30 hover:bg-pink-500/30',
  abstract:     'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30',
  concrete:     'bg-teal-500/15 text-teal-300 border-teal-500/30 hover:bg-teal-500/30',
  food:         'bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/30',
  animal:       'bg-lime-500/15 text-lime-300 border-lime-500/30 hover:bg-lime-500/30',
  medical:      'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/30',
  science:      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30',
  business:     'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30',
  politics:     'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/30',
  military:     'bg-slate-500/15 text-slate-300 border-slate-500/30 hover:bg-slate-500/30',
  law:          'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
}

const DEFAULT_STYLE = 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'

const TAG_VI = {
  noun: 'Danh từ', verb: 'Động từ', adjective: 'Tính từ', adverb: 'Trạng từ',
  phrase: 'Cụm từ', abstract: 'Trừu tượng', concrete: 'Hữu hình',
  food: 'Ẩm thực', animal: 'Động vật', medical: 'Y học', science: 'Khoa học',
  business: 'Kinh tế', politics: 'Chính trị', military: 'Quân sự', law: 'Pháp luật',
  religion: 'Tôn giáo', place: 'Địa điểm', transport: 'Giao thông', work: 'Nghề nghiệp',
  language: 'Ngôn ngữ', person: 'Loại người', agriculture: 'Nông nghiệp',
  fashion: 'Thời trang', education: 'Giáo dục', sport: 'Thể thao',
  nature: 'Thiên nhiên', plant: 'Thực vật', organization: 'Tổ chức',
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TagSelector({ onStart }) {
  const [tags, setTags]           = useState([])
  const [words, setWords]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  function loadData() {
    // Prefer manually synced cache (newer than build), else use bundled static data
    const cached = loadCache()
    if (cached) {
      setWords(cached.words)
      setTags(cached.tags)
      setFromCache(true)
    } else {
      setWords(getStaticWords())
      setTags(getStaticTags())
      setFromCache(false)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])  // eslint-disable-line

  const toggle = (name) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const filtered = selected.size === 0
    ? words
    : words.filter(w => [...selected].some(t => w.tags.includes(t)))

  const handleStart = () => {
    if (!filtered.length) return
    onStart(shuffle(filtered))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white/30 text-sm tracking-widest uppercase">Đang tải...</div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-6 px-6 text-center relative">
        <h1 className="text-3xl font-display font-semibold text-white tracking-tight">Flashcard</h1>
        <p className="mt-2 text-white/40 text-sm">
          {words.length} từ · {tags.length} nhãn
          {fromCache && <span className="ml-2 text-emerald-400/50">· synced</span>}
        </p>
        <button
          onClick={() => setShowSettings(true)}
          className="absolute right-6 top-12 p-2 rounded-full text-white/30
                     hover:text-white/60 hover:bg-white/8 transition-colors"
          title="Cài đặt"
        >
          <GearIcon />
        </button>
      </header>

      {/* Tags grid */}
      <main className="flex-1 px-6 pb-36 max-w-2xl mx-auto w-full">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-4 font-medium">
          {selected.size === 0 ? 'Chọn nhãn để lọc — mặc định học tất cả' : `${selected.size} nhãn đã chọn`}
        </p>

        <div className="flex flex-wrap gap-2">
          {tags.map(({ name, count }) => {
            const isSelected = selected.has(name)
            const style = TAG_STYLE[name] || DEFAULT_STYLE
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium
                  transition-all duration-150 cursor-pointer
                  ${style}
                  ${isSelected ? 'ring-2 ring-white/20 scale-105' : ''}
                `}
              >
                {TAG_VI[name] || name}
                <span className="text-xs opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-[#0d0d12] to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleStart}
            disabled={!filtered.length}
            className="
              w-full py-4 rounded-2xl font-semibold text-base tracking-wide
              bg-white text-[#0d0d12] hover:bg-white/90 active:scale-[0.98]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            Học {filtered.length} từ
          </button>
        </div>
      </div>

      {showSettings && (
        <Settings
          onClose={() => { setShowSettings(false); loadData() }}
        />
      )}
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
