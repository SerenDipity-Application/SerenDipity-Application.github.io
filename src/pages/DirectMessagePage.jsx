import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLang } from '../LangContext'
import { useAuth } from '../AuthContext'
import { members } from '../data'
import { threadId, sendMessage, subscribeToMessages } from '../firestoreDms'
import './DirectMessagePage.css'

const localKey   = id => `serendipity_dm_${id}`
const MEMBER_KEY = id => `serendipity_member_${id}`

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function today() { return new Date().toDateString() }

export default function DirectMessagePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLang()
  const { user } = useAuth()

  // ── Resolve the other person ──────────────────────────────────────────────
  const stateMember = location.state?.member
  if (stateMember) sessionStorage.setItem(MEMBER_KEY(id), JSON.stringify(stateMember))
  const member = stateMember
    || (() => { try { return JSON.parse(sessionStorage.getItem(MEMBER_KEY(id))) } catch { return null } })()
    || members.find(m => String(m.id) === id || String(m.uid) === id)
    || members[0]

  const name = (lang === 'zh' ? member?.zhName : member?.enName)
    || member?.enName || member?.zhName || 'Member'

  // ── Determine mode ────────────────────────────────────────────────────────
  // Both sides need real UIDs to use Firestore real-time chat.
  const myUid    = user?.uid
  const theirUid = member?.uid
  const useFirestore = !!(myUid && theirUid)
  const tid = useFirestore ? threadId(myUid, theirUid) : null

  // ── Message state ─────────────────────────────────────────────────────────
  const [messages, setMessages] = useState(() => {
    if (useFirestore) return [] // will be populated by onSnapshot
    try { return JSON.parse(localStorage.getItem(localKey(id)) || '[]') } catch { return [] }
  })
  const [input, setInput]       = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const messagesEndRef = useRef(null)
  const seededRef      = useRef(false)

  // ── Firestore real-time listener ──────────────────────────────────────────
  useEffect(() => {
    if (!useFirestore) return
    return subscribeToMessages(tid, setMessages)
  }, [tid, useFirestore])

  // ── Seed icebreaker as first message (Firestore path) ─────────────────────
  useEffect(() => {
    if (!useFirestore) return
    const first = location.state?.firstMessage
    if (!first || seededRef.current) return
    seededRef.current = true
    // Only seed once — check if thread already has messages after first snapshot
    const unsub = subscribeToMessages(tid, msgs => {
      unsub()
      if (msgs.length === 0) {
        sendMessage(tid, first, myUid).catch(() => {})
      }
    })
  }, [tid, useFirestore])

  // ── Seed icebreaker (localStorage fallback path) ──────────────────────────
  useEffect(() => {
    if (useFirestore) return
    const first = location.state?.firstMessage
    if (first && messages.length === 0 && !seededRef.current) {
      seededRef.current = true
      setMessages([{ id: Date.now(), side: 'me', text: first, time: nowTime(), day: today() }])
    }
  }, [])

  // ── Persist localStorage messages ─────────────────────────────────────────
  useEffect(() => {
    if (useFirestore) return
    localStorage.setItem(localKey(id), JSON.stringify(messages))
  }, [messages, id, useFirestore])

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send ──────────────────────────────────────────────────────────────────
  async function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    if (useFirestore) {
      await sendMessage(tid, text, myUid)
    } else {
      setMessages(prev => [...prev, { id: Date.now(), side: 'me', text, time: nowTime(), day: today() }])
    }
  }

  // ── Clear chat ────────────────────────────────────────────────────────────
  function clearChat() {
    // For localStorage path only — Firestore messages would need batch delete.
    if (!useFirestore) {
      localStorage.removeItem(localKey(id))
      setMessages([])
    }
    setMenuOpen(false)
  }

  const showSuggestion = messages.length >= 4 && !suggestionDismissed

  // ── Render helpers ────────────────────────────────────────────────────────
  // In Firestore mode, determine side by comparing senderUid to myUid.
  const sideOf = msg => useFirestore
    ? (msg.senderUid === myUid ? 'me' : 'them')
    : msg.side

  return (
    <div className="dm-page">
      {/* Header */}
      <div className="dm-header">
        <button className="dm-back" onClick={() => navigate('/chat')}>‹</button>
        <div className="dm-header-center">
          <span className="dm-header-name serif">{name}</span>
          <span className="dm-header-star">✦</span>
        </div>
        <div className="dm-more-wrap">
          <button className="dm-more" onClick={() => setMenuOpen(o => !o)}>···</button>
          {menuOpen && (
            <div className="dm-menu">
              <button className="dm-menu-item dm-menu-danger" onClick={clearChat}
                title={useFirestore ? 'Clears your local view only' : undefined}>
                {lang === 'zh' ? '清除对话' : 'Clear chat'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Match banner */}
      <div className="dm-match-banner">
        <span className="dm-match-star">✦</span>
        <span>{lang === 'zh' ? '你们通过 SerenDipity 取得了联系' : 'Connected via SerenDipity'}</span>
      </div>

      {/* Messages */}
      <div className="dm-messages">
        {messages.map((msg, i) => {
          const side = sideOf(msg)
          const showDivider = i > 0 && messages[i - 1].day !== msg.day
          return (
            <div key={msg.id}>
              {showDivider && (
                <div className="dm-date-divider">
                  <div className="dm-date-line" />
                  <span>{lang === 'zh' ? '今天' : 'Today'}</span>
                  <div className="dm-date-line" />
                </div>
              )}
              <div className={`dm-row dm-row-${side}`}>
                {side === 'them' && (
                  <div className="dm-avatar" style={{ background: member?.color || '#4A3A5A' }}>
                    {member?.initials || name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="dm-bubble-wrap">
                  <div className={`dm-bubble dm-bubble-${side}`}>{msg.text}</div>
                  <div className={`dm-time dm-time-${side}`}>
                    {msg.time}{side === 'me' && ' ✓✓'}
                  </div>
                </div>
                {side === 'me' && (
                  <div className="dm-avatar dm-avatar-me">
                    {lang === 'zh' ? '你' : 'Me'}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* SerenDipity Suggests card */}
        {showSuggestion && (
          <div className="dm-suggest-card">
            <button className="dm-suggest-close" onClick={() => setSuggestionDismissed(true)}>✕</button>
            <div className="dm-suggest-header">
              <span className="dm-suggest-star">✦</span>
              <span className="dm-suggest-label">
                {lang === 'zh' ? 'SerenDipity 建议' : 'SerenDipity Suggests'}
              </span>
            </div>
            <p className="dm-suggest-title serif">
              {lang === 'zh' ? '线上转线下 ✦' : 'Take it from chat to IRL ✦'}
            </p>
            <p className="dm-suggest-sub">
              {lang === 'zh' ? '规划一次精心策划的见面。' : 'Plan a thoughtfully curated meetup.'}
            </p>
            <button className="dm-suggest-btn serif">
              {lang === 'zh' ? '安排见面' : 'Plan a Date'}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="dm-input-bar">
        <button className="dm-input-plus">+</button>
        <input
          className="dm-input"
          placeholder={lang === 'zh' ? `发消息给${name}…` : `Message ${name}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="dm-send-btn" onClick={send} disabled={!input.trim()}>↑</button>
      </div>
    </div>
  )
}
