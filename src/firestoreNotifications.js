// ── Notification operations — now backed by FastAPI instead of Firestore ──
// Function signatures preserved for backward compatibility.

import api from './api'
import { getUserFromToken } from './api'

export async function sendDmRequest({ toUid, message, senderProfile }) {
  const cached = getUserFromToken()
  const fromUid = cached?.uid
  if (!toUid || !fromUid || toUid === fromUid) return

  await api.notifications.send({
    to_uid: toUid,
    type: 'dm_request',
    message,
    from_name: senderProfile?.enName || senderProfile?.zhName || 'Someone',
    from_zh_name: senderProfile?.zhName || '',
    from_initials: senderProfile?.initials || (senderProfile?.enName || '??').slice(0, 2).toUpperCase(),
    from_color: senderProfile?.color || '#4A3A5A',
    status: 'pending',
  })
}

// Polling-based notification subscription (replaces Firestore onSnapshot)
export function subscribeToNotifications(uid, callback) {
  if (!uid) return () => {}
  let active = true
  let timer = null

  const poll = async () => {
    if (!active) return
    try {
      const all = await api.notifications.list()
      if (!active) return
      const pending = all
        .filter(n => n.status === 'pending')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      // Map to the shape the frontend expects
      callback(pending.map(n => ({
        ...n,
        _id: String(n.id),
        fromUid: n.from_uid,
        fromName: n.from_name,
        fromZhName: n.from_zh_name,
        fromInitials: n.from_initials,
        fromColor: n.from_color,
        timestamp: { seconds: new Date(n.created_at).getTime() / 1000 },
      })))
    } catch (e) {
      console.warn('Notification poll error:', e)
    }
    if (active) {
      timer = setTimeout(poll, 5000)
    }
  }

  poll()
  return () => { active = false; clearTimeout(timer) }
}

export async function acceptNotification(uid, notifId) {
  await api.notifications.updateStatus(parseInt(notifId), 'accepted')
}

export async function rejectNotification(uid, notifId) {
  await api.notifications.updateStatus(parseInt(notifId), 'rejected')
}

// Admin: clear all test data (stub — backend would need a dedicated endpoint)
export async function clearAllTestData() {
  // This was only used by AdminPage for clearing notification/DM test data.
  // With the new backend, this would require a dedicated admin endpoint.
  // For now, it's a no-op.
  console.warn('clearAllTestData is not yet implemented on the backend')
}
