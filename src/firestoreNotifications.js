import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, serverTimestamp, getDocs, deleteDoc,
} from 'firebase/firestore'
import { db, auth } from './firebase'

// Write a DM request notification to the recipient's Firestore subcollection.
// Only fires when the target is a real authenticated user (has a uid).
export async function sendDmRequest({ toUid, message, senderProfile }) {
  const fromUid = auth.currentUser?.uid
  if (!toUid || !fromUid || toUid === fromUid) return
  await addDoc(collection(db, 'notifications', toUid, 'items'), {
    type: 'dm_request',
    fromUid,
    fromName:     senderProfile?.enName || senderProfile?.zhName || 'Someone',
    fromZhName:   senderProfile?.zhName || '',
    fromInitials: senderProfile?.initials || (senderProfile?.enName || '??').slice(0, 2).toUpperCase(),
    fromColor:    senderProfile?.color || '#4A3A5A',
    message,
    status: 'pending',
    read: false,
    timestamp: serverTimestamp(),
  })
}

// Real-time listener for the current user's pending DM requests.
export function subscribeToNotifications(uid, callback) {
  if (!uid) return () => {}
  return onSnapshot(
    collection(db, 'notifications', uid, 'items'),
    snap => {
      const all = snap.docs.map(d => ({ ...d.data(), _id: d.id }))
      const pending = all
        .filter(n => n.status === 'pending')
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      callback(pending)
    },
    err => console.warn('Notification listener error:', err)
  )
}

export async function acceptNotification(uid, notifId) {
  await updateDoc(doc(db, 'notifications', uid, 'items', notifId), {
    status: 'accepted', read: true,
  })
}

export async function rejectNotification(uid, notifId) {
  await updateDoc(doc(db, 'notifications', uid, 'items', notifId), {
    status: 'rejected', read: true,
  })
}

// Delete every notification item across all users (admin reset only).
export async function clearAllNotifications() {
  const topSnap = await getDocs(collection(db, 'notifications'))
  const deletes = []
  for (const userDoc of topSnap.docs) {
    const itemsSnap = await getDocs(collection(db, 'notifications', userDoc.id, 'items'))
    itemsSnap.docs.forEach(d => deletes.push(deleteDoc(d.ref)))
  }
  await Promise.all(deletes)
}
