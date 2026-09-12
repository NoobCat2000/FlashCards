import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const POS_LABEL = { n: 'n', v: 'v', adj: 'adj', adv: 'adv', phrase: 'phrase' }
const POS_STYLE = {
  n:      'bg-blue-500/20 text-blue-300',
  v:      'bg-emerald-500/20 text-emerald-300',
  adj:    'bg-amber-500/20 text-amber-300',
  adv:    'bg-violet-500/20 text-violet-300',
  phrase: 'bg-pink-500/20 text-pink-300',
}

function speak(text, lang = 'en-US') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

async function googleTranslate(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  const json = await res.json()
  return json[0].map(s => s[0]).join('')
}

function ContextMenu({ x, y, selectedText, fullText, onClose }) {
  const [translation, setTranslation] = useState(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Clamp to viewport
  const [pos, setPos] = useState({ x, y })
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({
      x: Math.min(x, window.innerWidth - rect.width - 8),
      y: Math.min(y, window.innerHeight - rect.height - 8),
    })
  }, [x, y, translation])

  async function handleTranslate(text) {
    setLoading(true)
    try {
      const result = await googleTranslate(text)
      setTranslation(result)
    } catch {
      setTranslation('Không dịch được.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      ref={ref}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 min-w-48 max-w-72 rounded-xl border border-white/10
                 bg-[#1e1e3a] shadow-2xl shadow-black/60 text-sm overflow-hidden"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Actions */}
      <div className="p-1">
        {selectedText && (
          <>
            <button
              className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/8
                         hover:text-white transition-colors flex items-center gap-2"
              onClick={() => handleTranslate(selectedText)}
            >
              <TranslateIcon />
              Dịch "{selectedText.length > 30 ? selectedText.slice(0, 30) + '…' : selectedText}"
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/8
                         hover:text-white transition-colors flex items-center gap-2"
              onClick={() => { speak(selectedText); onClose() }}
            >
              <SpeakerIcon size={14} />
              Đọc từ đã chọn
            </button>
            <div className="h-px bg-white/8 my-1" />
          </>
        )}
        <button
          className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/8
                     hover:text-white transition-colors flex items-center gap-2"
          onClick={() => handleTranslate(fullText)}
        >
          <TranslateIcon />
          Dịch cả đoạn
        </button>
        <button
          className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/8
                     hover:text-white transition-colors flex items-center gap-2"
          onClick={() => { speak(fullText); onClose() }}
        >
          <SpeakerIcon size={14} />
          Đọc cả đoạn
        </button>
      </div>

      {/* Translation result */}
      {(loading || translation) && (
        <div className="border-t border-white/8 px-3 py-2.5">
          {loading
            ? <p className="text-white/40 text-xs animate-pulse">Đang dịch…</p>
            : <p className="text-white/85 text-xs leading-relaxed">{translation}</p>
          }
        </div>
      )}
    </div>,
    document.body
  )
}

export default function FlashCard({ card, flipped, onFlip }) {
  const [menu, setMenu] = useState(null)
  const mouseDown = useRef(null)

  const fullText = card.senses.map(s =>
    [s.meaning, ...(s.examples || [])].join(' ')
  ).join(' ')

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    const sel = window.getSelection()?.toString().trim() || ''
    setMenu({ x: e.clientX, y: e.clientY, selectedText: sel })
  }, [])

  function handleBackClick(e) {
    if (!mouseDown.current) return
    const dx = e.clientX - mouseDown.current.x
    const dy = e.clientY - mouseDown.current.y
    const dragged = Math.sqrt(dx * dx + dy * dy) > 4
    if (!dragged && !window.getSelection()?.toString()) onFlip()
  }

  return (
    <div className="perspective w-full h-full">
      <div className={`card-inner relative w-full h-full ${flipped ? 'flipped' : ''}`}>

        {/* FRONT */}
        <div className="card-face absolute inset-0 flex flex-col items-center justify-center
                        bg-[#16162a] border border-white/8 rounded-3xl px-8 py-10 select-none cursor-pointer"
             onClick={onFlip}>
          <p className="font-display text-5xl font-semibold text-white tracking-tight text-center leading-tight">
            {card.word}
          </p>

          {card.pronunciation && (
            <p className="mt-3 text-white/40 text-lg font-mono tracking-wide">
              {card.pronunciation}
            </p>
          )}

          <button
            className="mt-6 p-3 rounded-full bg-white/5 hover:bg-white/10 active:scale-95
                       transition-all text-white/50 hover:text-white/80"
            onClick={e => { e.stopPropagation(); speak(card.word) }}
            title="Phát âm"
          >
            <SpeakerIcon />
          </button>

          <p className="absolute bottom-5 text-white/20 text-xs tracking-widest uppercase">
            Space để lật
          </p>
        </div>

        {/* BACK */}
        <div className="card-face card-back-face absolute inset-0 overflow-y-auto
                        bg-[#13132a] border border-white/8 rounded-3xl px-6 py-7 select-text"
             onMouseDown={e => { mouseDown.current = { x: e.clientX, y: e.clientY } }}
             onClick={handleBackClick}
             onContextMenu={handleContextMenu}>

          {/* Word header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
            <span className="font-display text-2xl font-medium text-white">{card.word}</span>
            {card.pronunciation && (
              <span className="text-white/35 text-sm font-mono">{card.pronunciation}</span>
            )}
            <button
              className="ml-auto p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40
                         hover:text-white/70 transition-all active:scale-95"
              onClick={e => { e.stopPropagation(); speak(card.word) }}
            >
              <SpeakerIcon size={14} />
            </button>
          </div>

          {/* Senses */}
          <div className="space-y-5">
            {card.senses.map((sense, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0
                                   ${POS_STYLE[sense.pos] || 'bg-white/10 text-white/50'}`}>
                    {POS_LABEL[sense.pos] || sense.pos}
                  </span>
                  <span className="text-white font-medium leading-snug">{sense.meaning}</span>
                </div>

                {sense.examples?.length > 0 && (
                  <ul className="space-y-1 pl-1">
                    {sense.examples.map((ex, j) => (
                      <li key={j} className="text-sm text-white/50 leading-relaxed">
                        <span className="text-white/25 mr-1">·</span>{ex}
                      </li>
                    ))}
                  </ul>
                )}

                {sense.synonyms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {sense.synonyms.map((s, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full
                                               bg-white/5 text-white/40 border border-white/8">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {i < card.senses.length - 1 && (
                  <hr className="border-white/8 mt-3" />
                )}
              </div>
            ))}
          </div>

          {card.note && (
            <div className="mt-5 pt-4 border-t border-white/8">
              <p className="text-xs text-white/35 leading-relaxed italic">{card.note}</p>
            </div>
          )}
        </div>
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          selectedText={menu.selectedText}
          fullText={fullText}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}

function SpeakerIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function TranslateIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  )
}
