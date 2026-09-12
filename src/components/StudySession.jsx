import { useState, useEffect, useCallback } from 'react'
import FlashCard from './FlashCard.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function StudySession({ cards: initialCards, onBack }) {
  const [deck, setDeck]       = useState(initialCards)
  const [index, setIndex]     = useState(0)
  const [flipped, setFlipped] = useState(false)

  const total   = deck.length
  const current = deck[index]

  const go = useCallback((dir) => {
    setFlipped(false)
    setIndex(i => Math.max(0, Math.min(total - 1, i + dir)))
  }, [total])

  const doShuffle = () => {
    setDeck(shuffle(deck))
    setIndex(0)
    setFlipped(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space')       { e.preventDefault(); setFlipped(f => !f) }
      if (e.code === 'ArrowRight')  go(1)
      if (e.code === 'ArrowLeft')   go(-1)
      if (e.code === 'KeyS')        doShuffle()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go])

  const progress = ((index + 1) / total) * 100

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3 max-w-2xl mx-auto w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70
                     text-sm transition-colors font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <span className="text-white/50 text-sm font-medium tabular-nums">
          {index + 1} / {total}
        </span>

        <button
          onClick={doShuffle}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70
                     text-sm transition-colors font-medium"
          title="Xáo bài (S)"
        >
          <ShuffleIcon />
          Xáo
        </button>
      </header>

      {/* Progress bar */}
      <div className="px-5 max-w-2xl mx-auto w-full mb-4">
        <div className="h-1 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/30 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card + side arrows */}
      <main className="flex-1 flex items-center justify-center relative px-14 max-w-3xl mx-auto w-full"
            style={{ minHeight: 380 }}>

        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="absolute left-0 p-3 rounded-full bg-white/5 border border-white/8
                     text-white/40 hover:text-white hover:bg-white/12
                     disabled:opacity-20 disabled:cursor-not-allowed
                     transition-all active:scale-90 z-10"
        >
          <ChevronIcon dir="left" />
        </button>

        <div className="w-full h-[calc(100vh-220px)] min-h-[340px] max-h-[560px]">
          <FlashCard
            key={index}
            card={current}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
          />
        </div>

        <button
          onClick={() => go(1)}
          disabled={index === total - 1}
          className="absolute right-0 p-3 rounded-full bg-white/5 border border-white/8
                     text-white/40 hover:text-white hover:bg-white/12
                     disabled:opacity-20 disabled:cursor-not-allowed
                     transition-all active:scale-90 z-10"
        >
          <ChevronIcon dir="right" />
        </button>
      </main>

      <footer className="pb-8 pt-3">
        <p className="text-center text-white/20 text-xs tracking-wide">
          Space lật · ← → điều hướng · S xáo
        </p>
      </footer>
    </div>
  )
}

function ChevronIcon({ dir }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left'
        ? <path d="M15 18l-6-6 6-6" />
        : <path d="M9 18l6-6-6-6" />}
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  )
}
