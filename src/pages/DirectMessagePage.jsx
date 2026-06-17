import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import './DirectMessagePage.css'

const storageKey = id => `serendipity_dm_${id}`
const MEMBER_CACHE_KEY = id => `serendipity_member_${id}`

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function today() {
  return new Date().toDateString()
}

export default function DirectMessagePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLang()

  const stateMember = location.state?.member
  if (stateMember) sessionStorage.setItem(MEMBER_CACHE_KEY(id), JSON.stringify(stateMember))
  const member = stateMember
    || (() => { try { return JSON.parse(sessionStorage.getItem(MEMBER_CACHE_KEY(id))) } catch { return null } })()
    || members.find(m => String(m.id) === id || String(m.uid) === id)
    || members[0]
  const name = (lang === 'zh' ? member.zhName : member.enName) || member.enName || member.zhName || 'Member'

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey(id))
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [input, setInput] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const seededRef = useRef(false)

  function clearChat() {
    localStorage.removeItem(storageKey(id))
    sessionStorage.removeItem(MEMBER_CACHE_KEY(id))
    setMessages([])
    setMenuOpen(false)
  }

  // Seed icebreaker as the first sent message — no auto-reply
  useEffect(() => {
    const first = location.state?.firstMessage
    if (first && messages.length === 0 && !seededRef.current) {
      seededRef.current = true
      setMessages([{ id: Date.now(), side: 'me', text: first, time: nowTime(), day: today() }])
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey(id), JSON.stringify(messages))
  }, [messages, id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [
      ...prev,
      { id: Date.now(), side: 'me', text, time: nowTime(), day: today() },
    ])
    setInput('')
  }

  const showSuggestion = messages.length >= 4 && !suggestionDismissed

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
              <button className="dm-menu-item dm-menu-danger" onClick={clearChat}>
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
              <div className={`dm-row dm-row-${msg.side}`}>
                {msg.side === 'them' && (
                  <div className="dm-avatar" style={{ background: member.color || '#4A3A5A' }}>
                    {member.initials || name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="dm-bubble-wrap">
                  <div className={`dm-bubble dm-bubble-${msg.side}`}>{msg.text}</div>
                  <div className={`dm-time dm-time-${msg.side}`}>
                    {msg.time}{msg.side === 'me' && ' ✓✓'}
                  </div>
                </div>
                {msg.side === 'me' && (
                  <div className="dm-avatar dm-avatar-me">
                    {lang === 'zh' ? '你' : 'Me'}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* SerenDipity Suggests card — appears after a few messages */}
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
          ref={inputRef}
          className="dm-input"
          placeholder={lang === 'zh' ? `发消息给${name}…` : `Message ${name}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        {input.trim() ? (
          <button className="dm-send-btn" onClick={send}>↑</button>
        ) : (
          <button className="dm-input-mic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
