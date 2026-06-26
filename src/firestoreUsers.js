// ── User data operations — now backed by FastAPI instead of Firestore ─────
// Function signatures preserved for backward compatibility with all page components.

import api from './api'
import { getUserFromToken, getToken } from './api'

// ── User ID ───────────────────────────────────────────────────────────────────
function getUserId() {
  const cached = getUserFromToken()
  if (cached?.uid) return cached.uid
  let id = localStorage.getItem('serendipity_uid')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('serendipity_uid', id)
  }
  return id
}

export function getExistingUserId() {
  const cached = getUserFromToken()
  return cached?.uid ?? localStorage.getItem('serendipity_uid')
}

// ── Onboarding ────────────────────────────────────────────────────────────────
export async function startOnboarding() {
  const uid = getUserId()
  try {
    await api.users.updateMe({
      uid,
      onboarding_status: 'started',
      onboarding_progress: { currentQ: 1, currentChapter: 'YOUR WORLD', completed: false },
    })
  } catch {
    // User might not be created yet — that's ok, progress will be saved later
  }
}

export async function updateOnboardingProgress(partialProfile, progressState) {
  try {
    await api.users.updateMe({
      ...partialProfile,
      onboarding_progress: progressState,
      onboarding_status: progressState.completed ? 'completed' : 'in_progress',
    })
    if (progressState.completed) {
      localStorage.setItem('serendipity_profile', JSON.stringify(partialProfile))
    }
  } catch (e) {
    console.error('Failed to update onboarding progress:', e)
  }
}

export async function saveUserToFirestore(profile) {
  try {
    await api.users.updateMe({
      ...profile,
      onboarding_status: 'completed',
      onboarding_progress: { currentQ: 9, currentChapter: 'YOUR SIGNALS', completed: true },
    })
    localStorage.setItem('serendipity_profile', JSON.stringify(profile))
  } catch (e) {
    console.error('Failed to save user:', e)
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────
export async function loadUserFromFirestore() {
  const cached = localStorage.getItem('serendipity_profile')
  if (cached) return JSON.parse(cached)
  try {
    return await api.users.getMe()
  } catch {
    return null
  }
}

export async function loadAllUsers() {
  try {
    return await api.users.list()
  } catch {
    return []
  }
}

// ── Real-time replaced with polling ──────────────────────────────────────────
// Firestore onSnapshot is replaced by setInterval-based polling.
// Returns an unsubscribe function (clears the interval).

export function subscribeToUsers(callback, onError) {
  let active = true
  let timer = null

  const poll = async () => {
    if (!active) return
    try {
      const users = await api.users.list()
      if (active) {
        callback(users.map(u => ({ ...u, _docId: u.uid })))
      }
    } catch (err) {
      console.warn('User poll error:', err)
      onError?.(err)
    }
    if (active) {
      timer = setTimeout(poll, 5000) // poll every 5 seconds
    }
  }

  poll() // initial fetch
  return () => { active = false; clearTimeout(timer) }
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function adminUpdateUser(uid, fields) {
  try {
    await api.users.update(uid, fields)
  } catch (e) {
    console.error('Admin update failed:', e)
  }
}

export async function adminDeleteUser(uid) {
  try {
    await api.users.remove(uid)
  } catch (e) {
    console.error('Admin delete failed:', e)
  }
}

// ── Photo ─────────────────────────────────────────────────────────────────────
function compressImage(file, maxPx = 300, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Image load timed out')), 15000)
    const reader = new FileReader()
    reader.onerror = (err) => { clearTimeout(timer); reject(err) }
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = (err) => { clearTimeout(timer); reject(err) }
      img.onload = () => {
        clearTimeout(timer)
        const size = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = maxPx
        canvas.height = maxPx
        const ctx = canvas.getContext('2d')
        const sx = (img.width  - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxPx, maxPx)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export async function uploadProfilePhoto(file) {
  const dataUrl = await compressImage(file)
  try {
    await api.users.updateMe({ photo_url: dataUrl })
  } catch (e) {
    console.error('Photo upload failed:', e)
  }
  try {
    const { loadUser, saveUser } = await import('./userStorage')
    const existing = loadUser()
    if (existing && (existing.zhName || existing.enName)) {
      saveUser({ ...existing, photoURL: dataUrl })
    }
  } catch {}
  try {
    const cached = localStorage.getItem('serendipity_profile')
    const profile = cached ? JSON.parse(cached) : {}
    localStorage.setItem('serendipity_profile', JSON.stringify({ ...profile, photoURL: dataUrl }))
  } catch {}
  return dataUrl
}

export async function fetchOwnPhotoURL() {
  try {
    const me = await api.users.getMe()
    return me?.photo_url || null
  } catch {
    return null
  }
}

// ── Check-in number ───────────────────────────────────────────────────────────
export async function assignCheckInNumber(uid, number) {
  try {
    await api.users.update(uid, { check_in_number: number })
  } catch (e) {
    console.error('Assign check-in number failed:', e)
  }
}
