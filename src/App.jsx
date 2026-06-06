import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import EntryPage from './pages/EntryPage'
import IntroPage from './pages/IntroPage'
import OnboardingPage from './pages/OnboardingPage'
import DirectoryPage from './pages/DirectoryPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import AIChatPage from './pages/AIChatPage'
import MyProfilePage from './pages/MyProfilePage'
import IcebreakerPage from './pages/IcebreakerPage'

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const noNav = ['/', '/intro', '/onboarding', '/icebreaker']
  if (noNav.some(p => location.pathname === p)) return null

  const active = location.pathname

  return (
    <nav className="bottom-nav">
      <button className={active === '/chat' || active === '/ai-chat' ? 'active' : ''} onClick={() => navigate('/chat')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        聊天
      </button>
      <button className={active === '/directory' ? 'active' : ''} onClick={() => navigate('/directory')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        名录
      </button>
      <button className={active === '/my-profile' ? 'active' : ''} onClick={() => navigate('/my-profile')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        我的
      </button>
    </nav>
  )
}

export default function App() {
  return (
    <div className="phone-shell">
      <div className="screen">
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
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
