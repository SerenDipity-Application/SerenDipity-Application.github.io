import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { useAuth } from '../AuthContext'
import { members as demoMembers } from '../data'
import { loadUserFromFirestore, subscribeToUsers } from '../firestoreUsers'
import './ChatPage.css'

// Score how well `other` matches `me` based on public intents + hidden signals
function matchScore(me, other) {
  if (!me) return 0
  const myIntents = new Set(me.intents || [])
  let score = 0

  // Intent tag overlap — strongest signal
  for (const intent of (other.intents || [])) {
    if (myIntents.has(intent)) score += 2
  }

  // hiddenSignals: free-text keywords matched against other's profile
  const signals = (me.hiddenSignals || '').toLowerCase()
  if (signals) {
    const words = signals.split(/[\s,，、。.]+/).filter(w => w.length > 1)
    const otherText = [
      other.industry || '', other.industryEn || '',
      other.quote || '', other.quoteEn || '',
      ...(other.intents || []),
    ].join(' ').toLowerCase()
    for (const word of words) {
      if (otherText.includes(word)) score += 1
    }
  }

  return score
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()
  const { user } = useAuth()

  const [myProfile, setMyProfile] = useState(null)
  const [firestoreUsers, setFirestoreUsers] = useState([])

  // Load own profile (includes hiddenSignals — only visible to self)
  useEffect(() => {
    loadUserFromFirestore().then(p => setMyProfile(p)).catch(() => {})
  }, [user?.uid])

  // Live directory subscription
  useEffect(() => {
    return subscribeToUsers(users => setFirestoreUsers(users), () => setFirestoreUsers([]))
  }, [])

  // Merge Firestore + demo, exclude self, rank by match score
  const myUid = user?.uid
  const ranked = (() => {
    const fsUids = new Set(firestoreUsers.map(u => u.uid).filter(Boolean))
    const combined = [
      ...firestoreUsers,
      ...demoMembers.filter(m => !fsUids.has(m.uid)),
    ].filter(m => {
      const id = m.uid || String(m.id)
      return id !== myUid && m.uid !== myUid
    })
    return combined
      .map(m => ({ ...m, _score: matchScore(myProfile, m) }))
      .sort((a, b) => b._score - a._score)
  })()

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h1 className="chat-title serif">{s.chatTitle}</h1>
          <p className="chat-sub">{s.chatSub.replace('{n}', ranked.length)}</p>
        </div>
      </div>

      {/* AI Concierge pinned card */}
      <div className="chat-ai-card" onClick={() => navigate('/ai-chat')}>
        <div className="chat-ai-pin">★</div>
        <div className="chat-ai-avatar">
          <span className="serif" style={{ fontSize: 20, color: 'var(--gold)' }}>SD</span>
        </div>
        <div className="chat-ai-info">
          <div className="chat-ai-name-row">
            <span className="chat-ai-name">{s.chatAIName}</span>
            <span className="chat-ai-badge">{s.chatAIBadge}</span>
            <span className="chat-ai-online">{s.online}</span>
          </div>
          <p className="chat-ai-preview">{s.chatAIPreview}</p>
        </div>
      </div>

      <p className="chat-section-label">
        {lang === 'zh' ? '✦ AI 推荐连接' : '✦ AI-Ranked Connections'}
      </p>

      <div className="chat-list">
        {ranked.length === 0 && (
          <p className="chat-empty">
            {lang === 'zh' ? '暂无推荐，完成档案即可解锁' : 'Complete your profile to unlock suggestions'}
          </p>
        )}
        {ranked.map(m => {
          const name     = lang === 'zh' ? (m.zhName || m.enName) : (m.enName || m.zhName)
          const school   = lang === 'zh' ? (m.school || m.schoolEn) : (m.schoolEn || m.school)
          const industry = lang === 'zh' ? (m.industry || m.industryEn) : (m.industryEn || m.industry)
          const preview  = lang === 'zh' ? (m.quote || m.quoteEn) : (m.quoteEn || m.quote)
          const stars    = Math.min(m._score, 3)

          return (
            <div
              key={m.uid || m.id}
              className="chat-item"
              onClick={() => navigate(`/dm/${m.uid || m.id}`, { state: { member: m } })}
            >
              <div className="chat-item-avatar" style={{ background: m.color || '#4A3A5A' }}>
                {m.initials || (name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="chat-item-info">
                <div className="chat-item-name-row">
                  <span className="chat-item-name">{name || '—'}</span>
                  {stars > 0 && (
                    <span className="chat-match-stars">{'✦'.repeat(stars)}</span>
                  )}
                </div>
                <p className="chat-item-school">{[school, industry].filter(Boolean).join(' · ')}</p>
                {preview && <p className="chat-item-preview">{preview}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
