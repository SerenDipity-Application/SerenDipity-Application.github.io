// ── API client for SerenDipity backend ──────────────────────────────────────
// Replaces firebase.js — all data goes through the FastAPI backend.

const BASE = import.meta.env.VITE_API_URL || ''

// ── Token management ───────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('sd_token')
}

function setToken(token) {
  localStorage.setItem('sd_token', token)
}

function clearToken() {
  localStorage.removeItem('sd_token')
}

// ── Current user cache ─────────────────────────────────────────────────────
function getUserFromToken() {
  try {
    const raw = localStorage.getItem('sd_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setUserCache(user) {
  if (user) {
    localStorage.setItem('sd_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('sd_user')
  }
}

// ── Request helper ─────────────────────────────────────────────────────────
async function request(method, path, body, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: opts.signal,
  })

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    const msg = detail.detail || `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    throw err
  }

  // Handle 204 No Content
  if (res.status === 204) return null
  return res.json()
}

// ── Public API ─────────────────────────────────────────────────────────────
const api = {
  // ── Auth ────────────────────────────────────────────────────────────────
  auth: {
    async register(username, password, email) {
      const data = await request('POST', '/auth/register', { username, password, email })
      setToken(data.token)
      setUserCache({ uid: data.uid, username: data.username, onboarding_status: data.onboarding_status, is_admin: data.is_admin })
      return data
    },

    async login(username, password) {
      const data = await request('POST', '/auth/login', { username, password })
      setToken(data.token)
      setUserCache({ uid: data.uid, username: data.username, onboarding_status: data.onboarding_status, is_admin: data.is_admin })
      return data
    },

    async google(credential) {
      const data = await request('POST', '/auth/google', { credential })
      setToken(data.token)
      setUserCache({ uid: data.uid, username: data.username, onboarding_status: data.onboarding_status, is_admin: data.is_admin })
      return data
    },

    async sendEmailLink(email) {
      return request('POST', '/auth/email-link', { email })
    },

    async verifyMagicToken(token) {
      const data = await request('GET', `/auth/magic/${token}`)
      setToken(data.token)
      setUserCache({ uid: data.uid, username: data.username, onboarding_status: data.onboarding_status, is_admin: data.is_admin })
      return data
    },

    logout() {
      clearToken()
      setUserCache(null)
    },

    getToken,
    getUserFromToken,
  },

  // ── Users ───────────────────────────────────────────────────────────────
  users: {
    async getMe() {
      return request('GET', '/users/me')
    },

    async get(uid) {
      return request('GET', `/users/${uid}`)
    },

    async list() {
      return request('GET', '/users')
    },

    async updateMe(profile) {
      return request('PUT', '/users/me', profile)
    },

    async update(uid, fields) {
      return request('PUT', `/users/${uid}`, fields)
    },

    async remove(uid) {
      return request('DELETE', `/users/${uid}`)
    },
  },

  // ── DMs ─────────────────────────────────────────────────────────────────
  dms: {
    async send(threadId, otherUid, text) {
      return request('POST', '/dms/send', { thread_id: threadId, other_uid: otherUid, text })
    },

    async threads() {
      return request('GET', '/dms/threads')
    },

    async messages(threadId) {
      return request('GET', `/dms/${threadId}/messages`)
    },
  },

  // ── Notifications ───────────────────────────────────────────────────────
  notifications: {
    async send(body) {
      return request('POST', '/notifications/send', body)
    },

    async list() {
      return request('GET', '/notifications')
    },

    async updateStatus(id, status) {
      return request('PUT', `/notifications/${id}/status`, { status })
    },
  },
}

export default api
export { getToken, setToken, clearToken, getUserFromToken }
