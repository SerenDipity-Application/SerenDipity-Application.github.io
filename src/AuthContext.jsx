import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setRealUser(u ?? null))
    return unsub
  }, [])

  const signOut = () => {
    firebaseSignOut(auth)
    stopImpersonation()
    setImpersonated(null)
    localStorage.removeItem('serendipity_profile')
    localStorage.removeItem('serendipity_ob_draft')
  }

  const exitImpersonation = () => {
    stopImpersonation()
    setImpersonated(null)
  }

  // When impersonating, synthesize a user-like object with the target's UID.
  // All hooks that call user.uid will use the impersonated UID automatically.
  const user = impersonated
    ? { uid: impersonated.uid, email: impersonated.email || null, _impersonated: true }
    : realUser

  return (
    <AuthContext.Provider value={{
      user,
      realUser,
      impersonated,
      loading: realUser === undefined,
      signOut,
      startImpersonation: (profile) => { startImpersonation(profile); setImpersonated(profile) },
      exitImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
