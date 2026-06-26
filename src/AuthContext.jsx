import { createContext, useContext, useEffect, useState } from 'react'
import api, { getToken, clearToken, getUserFromToken } from './api'

const AuthContext = createContext(null)

const IMPERSONATE_KEY = 'sd_impersonate'

export function getImpersonation() {
  try { return JSON.parse(sessionStorage.getItem(IMPERSONATE_KEY)) } catch { return null }
}

export function startImpersonation(profile) {
  sessionStorage.setItem(IMPERSONATE_KEY, JSON.stringify(profile))
}

export function stopImpersonation() {
  sessionStorage.removeItem(IMPERSONATE_KEY)
}

export function AuthProvider({ children }) {
  // undefined = still loading, null = not signed in, object = signed in
  const [realUser, setRealUser] = useState(undefined)
  const [impersonated, setImpersonated] = useState(() => getImpersonation())

  // On mount: validate cached token by fetching /users/me
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setRealUser(null)
      return
    }
    api.users.getMe()
      .then(u => setRealUser({ uid: u.uid, email: u.email || null }))
      .catch(() => { clearToken(); setRealUser(null) })
  }, [])

  // Called after login/register — refresh user state without page reload
  const refreshUser = async () => {
    try {
      const u = await api.users.getMe()
      setRealUser({ uid: u.uid, email: u.email || null })
    } catch {
      clearToken()
      setRealUser(null)
    }
  }

  const signOut = () => {
    api.auth.logout()
    stopImpersonation()
    setImpersonated(null)
    setRealUser(null)
    localStorage.removeItem('serendipity_profile')
    localStorage.removeItem('serendipity_ob_draft')
  }

  const exitImpersonation = () => {
    stopImpersonation()
    setImpersonated(null)
  }

  // When impersonating, synthesize a user-like object with the target's UID.
  const user = impersonated
    ? { uid: impersonated.uid, email: impersonated.email || null, _impersonated: true }
    : realUser

  return (
    <AuthContext.Provider value={{
      user,
      realUser,
      impersonated,
      loading: realUser === undefined,
      refreshUser,
      signOut,
      startImpersonation: (profile) => { startImpersonation(profile); setImpersonated(profile) },
      exitImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
