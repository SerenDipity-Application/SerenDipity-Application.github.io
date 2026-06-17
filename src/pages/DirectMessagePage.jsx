import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import './DirectMessagePage.css'

const storageKey = id => `serendipity_dm_${id}`

const repliesEN = [
  "Hi! So glad you reached out — I was hoping we'd connect. 😊",
  "That's really interesting! Would love to hear more about what you're working on.",
  "Definitely feel the same way. We should grab coffee sometime!",
  "Ha, small world! Oxford really does bring people together.",
  "Absolutely — when are you free next week?",
  "That sounds amazing. Let's make it happen!",
]
const repliesZH = [
  "你好！很高兴你主动联系，我也一直想和你聊聊 😊",
  "太有意思了！很想了解更多你在做的事情。",
  "完全一致！我们找个时间喝杯咖啡吧！",
  "哈，圈子真小！牛津真的把大家聚在一起了。",
  "好的，下周你什么时候有空？",
  "听起来很棒，一定要实现！",
]

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const MEMBER_CACHE_KEY = id => `serendipity_member_${id}`

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
  const [typing, setTyping] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const replyIndexRef = useRef(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const seededRef = useRef(false)

  // Seed icebreaker as first message
  useEffect(() => {
    const first = location.state?.firstMessage
    if (first && messages.length === 0 && !seededRef.current) {
      seededRef.current = true
      const msg = { id: Date.now(), side: 'me', text: first, time: nowTime(), day: today() }
      setMessages([msg])
      scheduleAutoReply()
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey(id), JSON.stringify(messages))
  }, [messages, id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function scheduleAutoReply() {
    const replies = lang === 'zh' ? repliesZH : repliesEN
    const text = replies[replyIndexRef.current % replies.length]
    replyIndexRef.current++
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [
        ...prev,
        { id: Date.now(), side: 'them', text, time: nowTime(), day: today() },
      ])
    }, 1400 + Math.random() * 600)
  }

  function send() {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [
      ...prev,
      { id: Date.now(), side: 'me', text, time: nowTime(), day: today() },
    ])
    setInput('')
    scheduleAutoReply()
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
        <button className="dm-more">···</button>
      </div>

      {/* Match banner */}
      <div className="dm-match-banner">
        <span className="dm-match-star">✦</span>
        <span>{lang === 'zh' ? '你们2天前完成了配对' : 'You matched 2 days ago'}</span>
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
                  <div className="dm-avatar" style={{ background: member.color }}>
                    {member.initials}
                  </div>
                )}
                <div className="dm-bubble-wrap">
                  <div className={`dm-bubble dm-bubble-${msg.side}`}>{msg.text}</div>
                  <div className={`dm-time dm-time-${msg.side}`}>
                    {msg.time}{msg.side === 'me' && ' ✓✓'}
                  </div>
                </div>
                {msg.side === 'me' && (
                  <div className="dm-avatar dm-avatar-me">你</div>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typing && (
          <div className="dm-row dm-row-them">
            <div className="dm-avatar" style={{ background: member.color }}>{member.initials}</div>
            <div className="dm-typing">
              <span /><span /><span />
            </div>
          </div>
        )}

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

function today() {
  return new Date().toDateString()
}
