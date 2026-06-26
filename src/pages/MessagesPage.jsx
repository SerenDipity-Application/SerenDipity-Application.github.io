import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { useAuth } from '../AuthContext'
import { subscribeToUserThreads } from '../firestoreDms'
import { loadAllUsers } from '../firestoreUsers'
import { members as demoMembers } from '../data'
import './MessagesPage.css'

function formatTime(seconds) {
  if (!seconds) return ''
  const date = new Date(seconds * 1000)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const { user } = useAuth()

  const [threads, setThreads]   = useState([])
  const [profiles, setProfiles] = useState({}) // uid → member object

  // Subscribe to this user's DM threads
  useEffect(() => {
    if (!user?.uid) return
    return subscribeToUserThreads(user.uid, setThreads)
  }, [user?.uid])

  // Build a uid→profile map from Firestore + demo members
  useEffect(() => {
    const map = {}
    demoMembers.forEach(m => { if (m.uid) map[m.uid] = m; map[String(m.id)] = m })
    // Check sessionStorage cache first
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith('serendipity_member_')) {
        try {
          const m = JSON.parse(sessionStorage.getItem(k))
          if (m?.uid) map[m.uid] = m
        } catch {}
      }
    })
    setProfiles(map)
    // Then load fresh from Firestore
    loadAllUsers().then(users => {
      users.forEach(u => { if (u.uid) map[u.uid] = u })
      setProfiles({ ...map })
    }).catch(() => {})
  }, [])

  const myUid = user?.uid

  return (
    <div className="msg-page">
      <div className="msg-header">
        <h1 className="msg-title serif">{lang === 'zh' ? '消息' : 'Messages'}</h1>
        <p className="msg-sub">
          {threads.length > 0
            ? (lang === 'zh' ? `${threads.length} 个对话` : `${threads.length} conversation${threads.length === 1 ? '' : 's'}`)
            : (lang === 'zh' ? '暂无消息' : 'No messages yet')}
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="msg-empty">
          <div className="msg-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="msg-empty-text">
            {lang === 'zh' ? '还没有对话' : 'No conversations yet'}
          </p>
          <p className="msg-empty-sub">
            {lang === 'zh'
              ? '在名录中向感兴趣的人打招呼，开始你的第一段对话吧。'
              : 'Say hi to someone in the Circle to start your first conversation.'}
          </p>
          <button className="msg-empty-btn serif" onClick={() => navigate('/directory')}>
            {lang === 'zh' ? '浏览名录 →' : 'Browse Circle →'}
          </button>
        </div>
      ) : (
        <div className="msg-list">
          {threads.map(thread => {
            const otherUid = thread.participants?.find(p => p !== myUid)
            const other = profiles[otherUid] || {}
            const name  = lang === 'zh'
              ? (other.zhName || other.enName || other.username || otherUid?.slice(0, 8) || '—')
              : (other.enName || other.zhName || other.username || otherUid?.slice(0, 8) || '—')
            const initials = other.initials || (name || '?').slice(0, 2).toUpperCase()
            const color    = other.color || '#4A3A5A'
            const preview  = thread.lastMessage || ''
            const isFromMe = thread.lastSenderUid === myUid

            return (
              <div
                key={thread.id}
                className="msg-item"
                onClick={() => navigate(`/dm/${otherUid}`, { state: { member: other.uid ? other : undefined } })}
              >
                {other.photoURL
                  ? <img src={other.photoURL} className="msg-avatar" style={{ objectFit: 'cover' }} alt={initials} />
                  : <div className="msg-avatar" style={{ background: color }}>{initials}</div>
                }
                <div className="msg-item-body">
                  <div className="msg-item-top">
                    <span className="msg-item-name">{name}</span>
                    <span className="msg-item-time">{formatTime(thread.lastTimestamp?.seconds)}</span>
                  </div>
                  <div className="msg-item-preview-row">
                    {isFromMe && <span className="msg-item-check">✓✓ </span>}
                    <span className="msg-item-preview">{preview}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
