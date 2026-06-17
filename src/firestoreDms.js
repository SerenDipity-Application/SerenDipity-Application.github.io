import {
  collection, addDoc, setDoc, doc, onSnapshot,
  serverTimestamp, query, orderBy, where,
} from 'firebase/firestore'
import { db } from './firebase'

// Deterministic thread ID — same for both participants regardless of who opens first.
export function threadId(uidA, uidB) {
  return [uidA, uidB].sort().join('_')
}

export async function sendMessage(tid, text, senderUid, otherUid) {
  await addDoc(collection(db, 'dms', tid, 'messages'), {
    text,
    senderUid,
    timestamp: serverTimestamp(),
  })
  // Keep thread doc up-to-date so the inbox can list and sort threads
  await setDoc(doc(db, 'dms', tid), {
    participants: [senderUid, otherUid].filter(Boolean),
    lastMessage: text,
    lastSenderUid: senderUid,
    lastTimestamp: serverTimestamp(),
  }, { merge: true })
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

// Returns all DM threads for a given user, sorted by most recent.
export function subscribeToUserThreads(myUid, callback) {
  if (!myUid) return () => {}
  const q = query(
    collection(db, 'dms'),
    where('participants', 'array-contains', myUid),
  )
  return onSnapshot(q, snap => {
    const threads = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.lastTimestamp?.seconds || 0) - (a.lastTimestamp?.seconds || 0))
    callback(threads)
  }, () => callback([]))
}
