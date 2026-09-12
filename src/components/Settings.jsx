import { useState, useEffect } from 'react'
import { getServerUrl, setServerUrl, fetchAll, saveCache } from '../lib/api.js'

export default function Settings({ onClose }) {
  const [url, setUrl]       = useState(getServerUrl)
  const [status, setStatus] = useState(null) // null | 'syncing' | 'ok' | 'err'
  const [lastSync, setLastSync] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem('fc_cache') || 'null')
      return c?.ts ? new Date(c.ts) : null
    } catch { return null }
  })

  async function handleSync() {
    setServerUrl(url)
    setStatus('syncing')
    try {
      const { words, tags } = await fetchAll()
      saveCache(words, tags)
      setLastSync(new Date())
      setStatus('ok')
    } catch (e) {
      setStatus('err')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md mx-4 mb-6 sm:mb-0 rounded-3xl
                      bg-[#1a1a2e] border border-white/10 p-6 shadow-2xl"
           onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Cài đặt</h2>
          <button onClick={onClose}
                  className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <CloseIcon />
          </button>
        </div>

        <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
          Địa chỉ server
        </label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="http://192.168.1.x:3001"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                     text-white placeholder-white/25 text-sm font-mono
                     focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors"
        />
        <p className="mt-1.5 text-xs text-white/25">
          Máy tính và điện thoại phải cùng WiFi
        </p>

        <button
          onClick={handleSync}
          disabled={status === 'syncing'}
          className="mt-4 w-full py-3.5 rounded-2xl font-semibold text-sm
                     bg-white text-[#0d0d12] hover:bg-white/90 active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {status === 'syncing' ? 'Đang đồng bộ…' : 'Đồng bộ dữ liệu'}
        </button>

        {status === 'ok' && (
          <p className="mt-3 text-center text-sm text-emerald-400">
            ✓ Đồng bộ thành công
          </p>
        )}
        {status === 'err' && (
          <p className="mt-3 text-center text-sm text-red-400">
            Không kết nối được. Kiểm tra IP và port.
          </p>
        )}
        {lastSync && status !== 'ok' && (
          <p className="mt-3 text-center text-xs text-white/25">
            Lần cuối: {lastSync.toLocaleString('vi-VN')}
          </p>
        )}
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
