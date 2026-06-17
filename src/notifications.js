// Utility to write a notification — call this when another user sends you a DM request.
// In production, replace localStorage with a Firestore listener on /notifications/{uid}.
export function addNotification({ fromId, fromName, initials, color, preview, member }) {
  try {
    const existing = JSON.parse(localStorage.getItem('serendipity_notifications') || '[]')
    const deduped = existing.filter(n => n.fromId !== fromId)
    const updated = [
      { id: Date.now(), fromId, fromName, initials, color, preview, member, read: false },
      ...deduped,
    ].slice(0, 50)
    localStorage.setItem('serendipity_notifications', JSON.stringify(updated))
    window.dispatchEvent(new Event('serendipity_notif_update'))
  } catch {}
}
