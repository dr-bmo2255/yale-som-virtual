import { useSyncExternalStore } from 'react'

// Professors you can talk to. `slug` matches the backend: /api/professors/<slug>/chat
export const CHAT_PROFS = {
  'tauhid-zaman': {
    name: 'Prof. Tauhid Zaman',
    short: 'Prof. Zaman',
    thinking: 'yo, thinking…',
    course: 'MGT 409 · AI Foundations for Managers',
    greeting: "Yo yo yo! Welcome to Evans 2200. Ask me anything: AI agents, regressions, the central limit theorem, what classes to take. Let's gooo.",
  },
  'peter-schott': {
    name: 'Prof. Peter Schott',
    short: 'Prof. Schott',
    thinking: 'ooh, great question, one sec…',
    course: 'MGT 407 · Statistics',
    greeting: "Hey hey, welcome! Peter Schott here. Stats questions, trade questions, Totoro questions: all fair game. Fair warning, I'm going to ask you to explain it back to me in plain English.",
  },
}

// near: slug of the professor you are standing in front of; open: slug you are chatting with
let state = { near: null, open: null, busy: false }
const subs = new Set()

export const chat = {
  get: () => state,
  set(patch) {
    if (Object.keys(patch).every((k) => state[k] === patch[k])) return
    state = { ...state, ...patch }
    subs.forEach((f) => f())
  },
  subscribe(f) {
    subs.add(f)
    return () => subs.delete(f)
  },
}

export const useChat = () => useSyncExternalStore(chat.subscribe, chat.get)

// true while the user is typing in a text box, so game keys (WASD, M, Space) stay out of the way
export const typing = (e) => !!e.target?.closest?.('input, textarea')
