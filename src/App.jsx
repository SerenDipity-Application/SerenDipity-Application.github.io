import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { subscribeToNotifications, acceptNotification, rejectNotification } from './firestoreNotifications'
import { useLang } from './LangContext'
import api from './api'
import EntryPage from './pages/EntryPage'
import IntroPage from './pages/IntroPage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DirectoryPage from './pages/DirectoryPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import AIChatPage from './pages/AIChatPage'
import MyProfilePage from './pages/MyProfilePage'
import IcebreakerPage from './pages/IcebreakerPage'
import InvitationsPage from './pages/InvitationsPage'
import AdminPage from './pages/AdminPage'
import DirectMessagePage from './pages/DirectMessagePage'
import MessagesPage from './pages/MessagesPage'

// ── Shared helper ─────────────────────────────────────────────────────────────
function useOverlayProps() {
  const location = useLocation()
  const hidden = location.pathname === '/admin' || location.pathname.startsWith('/dm/')
  const darkPages = ['/', '/intro', '/onboarding', '/auth']
  const isDark = darkPages.includes(location.pathname)
  return { hidden, isDark }
}

// ── Top-right overlay: lang toggle + notification bell ────────────────────────
function GlobalOverlayButtons() {
  const navigate = useNavigate()
  const { lang, toggle } = useLang()
  const { hidden, isDark } = useOverlayProps()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [preview, setPreview] = useState(null) // notif object being previewed

  // Subscribe to Firestore notifications for the logged-in user
  useEffect(() => {
    if (!user?.uid) return
    return subscribeToNotifications(user.uid, setNotifs)
  }, [user?.uid])

  if (hidden) return null

  const unread = notifs.filter(n => !n.read).length
  const iconColor = isDark ? '#C9A84C' : '#3D1A47'
  const bg     = isDark ? 'rgba(201,168,76,0.12)' : 'rgba(61,26,71,0.07)'
  const border = isDark ? 'rgba(201,168,76,0.4)'  : 'rgba(61,26,71,0.2)'
  const btnBase = { background: bg, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: `1px solid ${border}`, cursor: 'pointer' }

  const openPanel = () => { setOpen(true); setPreview(null) }
  const closePanel = () => { setOpen(false); setPreview(null) }

  const handleAccept = async (n) => {
    try { await acceptNotification(user.uid, n._id) } catch {}
    // Seed the received icebreaker as a 'them' message in this user's DM thread
    const threadKey = `serendipity_dm_${n.fromUid}`
    if (!localStorage.getItem(threadKey)) {
      const senderMember = { uid: n.fromUid, enName: n.fromName, zhName: n.fromZhName, initials: n.fromInitials, color: n.fromColor }
      localStorage.setItem(threadKey, JSON.stringify([{
        id: Date.now(), side: 'them', text: n.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        day: new Date().toDateString(),
      }]))
      sessionStorage.setItem(`serendipity_member_${n.fromUid}`, JSON.stringify(senderMember))
      navigate(`/dm/${n.fromUid}`, { state: { member: senderMember } })
    } else {
      navigate(`/dm/${n.fromUid}`)
    }
    closePanel()
  }

  const handleDecline = async (n) => {
    try { await rejectNotification(user.uid, n._id) } catch {}
    setPreview(null)
  }

  const panelStyle = {
    position: 'absolute', top: 42, right: 0,
    width: 290, background: '#FFFFFF',
    borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
    overflow: 'hidden', zIndex: 600,
  }
  const hdr = { padding: '14px 16px 12px', borderBottom: '1px solid #EDE6D8', display: 'flex', alignItems: 'center', gap: 8 }
  const sf  = { fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: '#3D1A47', flex: 1 }
  const row = (read) => ({ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F5F0EB', display: 'flex', gap: 10, alignItems: 'flex-start', background: read ? '#fff' : '#FAF7FF' })

  return (
    <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 500, display: 'flex', alignItems: 'center', gap: 8 }}>

      {/* Lang toggle */}
      <button onClick={toggle} style={{ ...btnBase, borderRadius: 50, padding: '5px 14px', fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: '1.5px', color: isDark ? '#C9A84C' : '#3D1A47', textTransform: 'uppercase' }}>
        {lang === 'zh' ? 'EN' : '中文'}
      </button>

      {/* Bell */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => open ? closePanel() : openPanel()} style={{ ...btnBase, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" width="16" height="16">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unread > 0 && (
            <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, background: '#D94F4F', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '0 3px' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div style={panelStyle}>
            {/* Panel header */}
            <div style={hdr}>
              {preview && (
                <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#9B7FA6', cursor: 'pointer', lineHeight: 1, padding: 0 }}>‹</button>
              )}
              <span style={sf}>{preview ? (lang === 'zh' ? '招呼请求' : 'DM Request') : (lang === 'zh' ? '通知' : 'Notifications')}</span>
            </div>

            {/* Preview: single notification with Accept / Decline */}
            {preview ? (
              <div style={{ padding: '20px 18px' }}>
                {/* Sender */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: preview.fromColor || '#4A3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                    {preview.fromInitials || '??'}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1020', fontFamily: "'Inter', sans-serif", margin: 0 }}>{preview.fromName}</p>
                    <p style={{ fontSize: 12, color: '#9B7FA6', fontFamily: "'Inter', sans-serif", margin: 0 }}>{lang === 'zh' ? '向你发送了招呼' : 'sent you a greeting'}</p>
                  </div>
                </div>

                {/* Message bubble */}
                <div style={{ background: '#3D1A47', borderRadius: 14, borderBottomLeftRadius: 4, padding: '13px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, color: '#fff', fontFamily: "'Inter', sans-serif", lineHeight: 1.6, margin: 0 }}>{preview.message}</p>
                </div>

                {/* Accept / Decline */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleDecline(preview)}
                    style={{ flex: 1, background: 'none', border: '1.5px solid #DDD5C8', borderRadius: 50, padding: '11px', fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#9B7FA6', cursor: 'pointer' }}>
                    {lang === 'zh' ? '拒绝' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleAccept(preview)}
                    style={{ flex: 2, background: '#3D1A47', border: 'none', borderRadius: 50, padding: '11px', fontSize: 14, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.3px' }}>
                    {lang === 'zh' ? '接受并回复' : 'Accept & Reply'}
                  </button>
                </div>
              </div>
            ) : notifs.length === 0 ? (
              /* Empty state */
              <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" width="32" height="32" style={{ marginBottom: 10 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p style={{ fontSize: 14, color: '#4A3A5A', fontFamily: "'Inter', sans-serif", fontWeight: 500, margin: 0 }}>
                  {lang === 'zh' ? '暂无通知' : "You're all caught up"}
                </p>
                <p style={{ fontSize: 12, color: '#B8A8C8', fontFamily: "'Inter', sans-serif", marginTop: 6, lineHeight: 1.5 }}>
                  {lang === 'zh' ? '有人向你打招呼时，会在这里显示。' : 'DM requests from others will appear here.'}
                </p>
              </div>
            ) : (
              /* Notification list */
              notifs.map(n => (
                <div key={n._id} onClick={() => setPreview(n)} style={row(n.read)}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: n.fromColor || '#4A3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                    {n.fromInitials || '??'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1020', fontFamily: "'Inter', sans-serif", margin: 0 }}>{n.fromName}</p>
                    <p style={{ fontSize: 12, color: '#9B7FA6', fontFamily: "'Inter', sans-serif", marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lang === 'zh' ? '向你发送了招呼 ✦' : 'sent you a greeting ✦'}
                    </p>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3D1A47', marginTop: 6, flexShrink: 0 }} />}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Bottom navigation ─────────────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { s } = useLang()
  const noNav = ['/', '/intro', '/onboarding', '/auth', '/admin']
  if (noNav.some(p => location.pathname === p) || location.pathname.startsWith('/dm/')) return null

  const active = location.pathname

  const tabs = [
    {
      path: '/chat',
      label: s.navChat,
      match: ['/chat', '/ai-chat'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2C6.48 2 2 6.03 2 11c0 2.4 1 4.6 2.7 6.2L4 22l5.1-2.1C10.3 20.6 11.1 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z"/>
        </svg>
      ),
    },
    {
      path: '/directory',
      label: s.navDirectory,
      match: ['/directory'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      path: '/messages',
      label: s.navMessages,
      match: ['/messages'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      path: '/my-profile',
      label: s.navProfile,
      match: ['/my-profile', '/invitations'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <circle cx="9" cy="10" r="2"/>
          <path d="M5 20v-1a4 4 0 0 1 8 0v1"/>
          <path d="M15 8h4M15 12h4"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.path}
          className={tab.match.includes(active) ? 'active' : ''}
          onClick={() => navigate(tab.path)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

// ── Auth guard — redirects unauthenticated users to /auth ────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('[RequireAuth] loading:', loading, 'user:', user?.uid || null)
    if (!loading && !user) navigate('/auth', { replace: true })
  }, [user, loading])

  if (loading || !user) return null
  return children
}

// ── Session restore — redirect authenticated users from entry page ─────────
function SessionRestorer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()

  // Route already-authenticated users away from the entry page only.
  useEffect(() => {
    if (loading || location.pathname !== '/') return
    if (!user) return
    api.users.getMe().then(me => {
      if (me.onboardingStatus === 'completed') {
        navigate('/directory', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }).catch(() => {})
  }, [user, loading, location.pathname])

  return null
}

// ── Impersonation banner ──────────────────────────────────────────────────────
function ImpersonationBanner() {
  const { impersonated, exitImpersonation } = useAuth()
  const navigate = useNavigate()
  if (!impersonated) return null
  const name = impersonated.enName || impersonated.zhName || impersonated.uid
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#D97706', color: '#fff',
      padding: '6px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 600,
      letterSpacing: '0.3px',
    }}>
      <span>👤 Viewing as {name}</span>
      <button
        onClick={() => { exitImpersonation(); navigate('/admin') }}
        style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
      >
        Exit ✕
      </button>
    </div>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  return (
    <div className={isAdmin ? '' : 'phone-shell'}>
      <SessionRestorer />
      {!isAdmin && <ImpersonationBanner />}
      {!isAdmin && <GlobalOverlayButtons />}
      <div className={isAdmin ? '' : 'screen'}>
        <Routes>
          {/* Public — no auth required */}
          <Route path="/"      element={<EntryPage />} />
          <Route path="/intro" element={<IntroPage />} />
          <Route path="/auth"  element={<AuthPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Protected — must be logged in */}
          <Route path="/onboarding"     element={<RequireAuth><OnboardingPage /></RequireAuth>} />
          <Route path="/directory"      element={<RequireAuth><DirectoryPage /></RequireAuth>} />
          <Route path="/profile/:id"    element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/chat"           element={<RequireAuth><ChatPage /></RequireAuth>} />
          <Route path="/ai-chat"        element={<RequireAuth><AIChatPage /></RequireAuth>} />
          <Route path="/my-profile"     element={<RequireAuth><MyProfilePage /></RequireAuth>} />
          <Route path="/icebreaker/:id" element={<RequireAuth><IcebreakerPage /></RequireAuth>} />
          <Route path="/messages"       element={<RequireAuth><MessagesPage /></RequireAuth>} />
          <Route path="/dm/:id"         element={<RequireAuth><DirectMessagePage /></RequireAuth>} />
          <Route path="/invitations"    element={<RequireAuth><InvitationsPage /></RequireAuth>} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
