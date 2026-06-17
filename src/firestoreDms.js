import {
  collection, addDoc, onSnapshot,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

// Deterministic thread ID — same for both participants regardless of who opens first.
export function threadId(uidA, uidB) {
  return [uidA, uidB].sort().join('_')
}

export async function sendMessage(tid, text, senderUid) {
  await addDoc(collection(db, 'dms', tid, 'messages'), {
    text,
    senderUid,
    timestamp: serverTimestamp(),
  })
}

// Returns an unsubscribe function. Calls callback with array of message objects.
export function subscribeToMessages(tid, callback) {
  const q = query(
    collection(db, 'dms', tid, 'messages'),
    orderBy('timestamp', 'asc'),
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => {
      const data = d.data()
      const ts = data.timestamp?.toDate?.() || new Date()
      return {
        id: d.id,
        text: data.text,
        senderUid: data.senderUid,
        time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        day: ts.toDateString(),
      }
    }))
  })
}
