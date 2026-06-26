// ── DM operations — now backed by FastAPI instead of Firestore ────────────
// Function signatures preserved for backward compatibility.

import api from './api'
import { getUserFromToken } from './api'

// Deterministic thread ID — same for both participants
export function threadId(uidA, uidB) {
  return [uidA, uidB].sort().join('_')
}

export async function sendMessage(tid, text, senderUid, otherUid) {
  const result = await api.dms.send(tid, otherUid, text)
  return result
}

// Polling-based message subscription (replaces Firestore onSnapshot)
export function subscribeToMessages(tid, callback) {
  let active = true
  let timer = null
  let lastCount = 0

  const poll = async () => {
    if (!active) return
    try {
      const msgs = await api.dms.messages(tid)
      if (!active) return
      const formatted = msgs.map(m => ({
        id: m.id,
        text: m.text,
        senderUid: m.sender_uid,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        day: new Date(m.created_at).toDateString(),
      }))
      callback(formatted)
      lastCount = msgs.length
    } catch (e) {
      console.warn('DM poll error:', e)
    }
    if (active) {
      timer = setTimeout(poll, 3000) // poll every 3 seconds
    }
  }

  poll()
  return () => { active = false; clearTimeout(timer) }
}

// Polling-based thread subscription
export function subscribeToUserThreads(myUid, callback) {
  if (!myUid) return () => {}
  let active = true
  let timer = null

  const poll = async () => {
    if (!active) return
    try {
      const threads = await api.dms.threads()
      if (active) {
        // Sort by last_timestamp descending
        threads.sort((a, b) => new Date(b.last_timestamp) - new Date(a.last_timestamp))
        callback(threads)
      }
    } catch {
      if (active) callback([])
    }
    if (active) {
      timer = setTimeout(poll, 3000)
    }
  }

  poll()
  return () => { active = false; clearTimeout(timer) }
}
