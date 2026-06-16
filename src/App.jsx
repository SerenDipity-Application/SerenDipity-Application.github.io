import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useLang } from './LangContext'
import EntryPage from './pages/EntryPage'
import IntroPage from './pages/IntroPage'
import OnboardingPage from './pages/OnboardingPage'
import DirectoryPage from './pages/DirectoryPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import AIChatPage from './pages/AIChatPage'
import MyProfilePage from './pages/MyProfilePage'
import IcebreakerPage from './pages/IcebreakerPage'
import InvitationsPage from './pages/InvitationsPage'
import AdminPage from './pages/AdminPage'

function GlobalLangToggle() {
  const { lang, toggle } = useLang()
  const location = useLocation()
  if (location.pathname === '/admin') return null
  const darkPages = ['/', '/intro', '/onboarding']
  const isDark = darkPages.includes(location.pathname)

  return (
    <button onClick={toggle} style={{
      position: 'fixed',
      top: 16, right: 16,
      zIndex: 500,
      background: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(61,26,71,0.07)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: `1px solid ${isDark ? 'rgba(201,168,76,0.4)' : 'rgba(61,26,71,0.2)'}`,
      borderRadius: 50,
      padding: '5px 14px',
      fontSize: 11,
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      letterSpacing: '1.5px',
      color: isDark ? '#C9A84C' : '#3D1A47',
      cursor: 'pointer',
      textTransform: 'uppercase',
    }}>
      {lang === 'zh' ? 'EN' : '中文'}
    </button>
  )
}

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { s } = useLang()
  const noNav = ['/', '/intro', '/onboarding', '/admin']
  if (noNav.some(p => location.pathname === p)) return null

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
      path: '/my-profile',
      label: s.navProfile,
      match: ['/my-profile'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <circle cx="9" cy="10" r="2"/>
          <path d="M5 20v-1a4 4 0 0 1 8 0v1"/>
          <path d="M15 8h4M15 12h4"/>
        </svg>
      ),
    },
    {
      path: '/invitations',
      label: s.navInvitations,
      match: ['/invitations'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
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

function AppShell() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  return (
    <div className={isAdmin ? '' : 'phone-shell'}>
      {!isAdmin && <GlobalLangToggle />}
      <div className={isAdmin ? '' : 'screen'}>
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/intro" element={<IntroPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/my-profile" element={<MyProfilePage />} />
          <Route path="/icebreaker/:id" element={<IcebreakerPage />} />
          <Route path="/invitations" element={<InvitationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return <AppShell />
}
