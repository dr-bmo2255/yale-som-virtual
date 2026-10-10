import { useEffect, useRef, useState } from 'react'
import { CHAT_PROFS, chat } from './chatStore.js'

// The backend is the FastAPI app in backend/. In dev, Vite proxies /api to it (see vite.config.js).
const API = import.meta.env.VITE_API_URL ?? ''
const SESSION = crypto.randomUUID?.() ?? String(Math.random()).slice(2)
const OFFLINE = "Can't reach the professor backend. Start it from the backend folder: .venv/bin/python -m uvicorn main:app --port 8000"

const logs = new Map() // slug -> messages, so the conversation survives closing the window

async function ask(slug, message) {
  let res
  try {
    res = await fetch(`${API}/api/professors/${slug}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: SESSION }),
    })
  } catch {
    throw new Error(OFFLINE)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : OFFLINE)
  return data.reply
}

export default function ChatPanel({ slug, onClose }) {
  const prof = CHAT_PROFS[slug]
  const [msgs, setMsgs] = useState(() => logs.get(slug) ?? [{ role: 'prof', text: prof.greeting }])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useRef(null)
  const input = useRef(null)

  useEffect(() => {
    logs.set(slug, msgs)
    list.current.scrollTop = list.current.scrollHeight
  }, [slug, msgs, busy])
  useEffect(() => {
    input.current.focus()
    return () => chat.set({ busy: false })
  }, [])

  const send = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    setMsgs((m) => [...m, { role: 'me', text }])
    setBusy(true)
    chat.set({ busy: true })
    try {
      const reply = await ask(slug, text)
      setMsgs((m) => [...m, { role: 'prof', text: reply }])
    } catch (err) {
      setMsgs((m) => [...m, { role: 'error', text: err.message }])
    }
    setBusy(false)
    chat.set({ busy: false })
    input.current?.focus()
  }

  return (
    <div className="chat">
      <div className="chathead">
        <div>
          <div className="chatname">{prof.name}</div>
          <div className="chatcourse">{prof.course}</div>
        </div>
        <button className="chatclose" onClick={onClose} aria-label="Close chat">
          ×
        </button>
      </div>
      <div className="chatlog" ref={list}>
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="bubble prof thinking">{prof.thinking}</div>}
      </div>
      <form className="chatform" onSubmit={send}>
        <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Ask ${prof.short} anything…`} maxLength={4000} />
        <button disabled={busy || !draft.trim()}>Send</button>
      </form>
    </div>
  )
}
