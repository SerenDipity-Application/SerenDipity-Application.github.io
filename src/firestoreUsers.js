import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  collection, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'users'

// ── User ID ───────────────────────────────────────────────────────────────────
// A fresh UID is generated each browser session (sessionStorage).
// sessionStorage is cleared automatically when the tab/browser is closed,
// so every new visit starts with a clean identity — no bleed between users.
function getUserId() {
  let id = sessionStorage.getItem('serendipity_uid')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('serendipity_uid', id)
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
  // Also cache in sessionStorage so My Card works without a Firestore round-trip
  sessionStorage.setItem('serendipity_profile', JSON.stringify(profile))
}

// ── Read own profile (session cache → Firestore fallback) ─────────────────────
export async function loadUserFromFirestore() {
  const cached = sessionStorage.getItem('serendipity_profile')
  if (cached) return JSON.parse(cached)
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
export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, COLLECTION), snap => {
    callback(snap.docs.map(d => ({ ...d.data(), _docId: d.id })))
  })
}

// ── Admin: update any fields on a user record ─────────────────────────────────
export async function adminUpdateUser(uid, fields) {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...fields,
    adminUpdatedAt: serverTimestamp(),
  })
}

// ── Admin: delete a user record ───────────────────────────────────────────────
export async function adminDeleteUser(uid) {
  await deleteDoc(doc(db, COLLECTION, uid))
}

// ── Admin: assign sequential check-in number ─────────────────────────────────
export async function assignCheckInNumber(uid, number) {
  await updateDoc(doc(db, COLLECTION, uid), {
    checkInNumber: number,
    adminUpdatedAt: serverTimestamp(),
  })
}
