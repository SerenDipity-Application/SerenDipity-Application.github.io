import {
  doc, setDoc, getDoc, getDocs,
  collection, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'users'

// ── User ID ───────────────────────────────────────────────────────────────────
// Each device gets a random ID on first visit, stored in localStorage.
// This is the Firestore document ID for that user's profile.
function getUserId() {
  let id = localStorage.getItem('serendipity_uid')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('serendipity_uid', id)
  }
  return id
}

// ── Write own profile ─────────────────────────────────────────────────────────
export async function saveUserToFirestore(profile) {
  const uid = getUserId()
  await setDoc(doc(db, COLLECTION, uid), {
    ...profile,
    uid,
    updatedAt: serverTimestamp(),
  })
}

// ── Read own profile ──────────────────────────────────────────────────────────
export async function loadUserFromFirestore() {
  const uid = getUserId()
  const snap = await getDoc(doc(db, COLLECTION, uid))
  return snap.exists() ? snap.data() : null
}

// ── Read all users (one-time) ─────────────────────────────────────────────────
export async function loadAllUsers() {
  const snap = await getDocs(collection(db, COLLECTION))
  return snap.docs.map(d => d.data())
}

// ── Real-time listener for all users ─────────────────────────────────────────
// Returns an unsubscribe function — call it on component unmount.
export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, COLLECTION), snap => {
    callback(snap.docs.map(d => d.data()))
  })
}
