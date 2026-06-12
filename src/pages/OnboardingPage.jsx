import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { saveUser } from '../userStorage'
import { saveUserToFirestore } from '../firestoreUsers'
import './OnboardingPage.css'

// ── Concierge script ──────────────────────────────────────────────────────────
// Follows serendipity_system_prompt.md exactly.
// Replace getConciergeMessage() with a real API call to POST /api/concierge/message
// when the Node.js/Express backend is ready.

const CHAPTERS = {
  1: 'YOUR WORLD',  2: 'YOUR WORLD',  3: 'YOUR WORLD',
  4: 'YOUR STORY',  5: 'YOUR STORY',  6: 'YOUR STORY',
  7: 'YOUR INTENTIONS',
  8: 'YOUR SIGNALS', 9: 'YOUR SIGNALS',
}
const PROGRESS = {
  1:  5,  2: 14,  3: 22,
  4: 33,  5: 44,  6: 55,
  7: 68,
  8: 82,  9: 94,
  10: 100,
}

const INTENT_TAGS = {
  en: [
    'Creative collaboration', 'Mentorship', 'Shared ventures',
    'Meaningful conversation', 'Possibility', 'Cultural exchange',
    'Friendship', 'Romance', 'Investment & business', 'Finding a co-founder',
  ],
  zh: [
    '创意合作', '导师与被导师', '共同创业',
    '有深度的对话', '探索可能性', '文化交流',
    '结交朋友', '浪漫邂逅', '投资与商业', '寻找联合创始人',
  ],
}

function getConciergeMessage(q, lang, answers) {
  const zh = lang === 'zh'
  const name = answers.name ? answers.name.split(' ')[0] : ''

  const messages = {
    en: {
      1: `Welcome to SerenDipity. Tonight — and every room after this — begins here.\n\nBefore we introduce you to your circle, we'd love to know a little about you.\n\nWhat's your name?`,
      2: `${name ? `Lovely, ${name}.` : 'Lovely.'} Which city do you call home right now?`,
      3: `Upload a photo for your Connection Card — this is how your circle will first see you. One that feels like you.\n\n(You can skip this and add one later from your profile.)`,
      4: `Every great room has a story behind it. Where did you study?`,
      5: `And what do you spend your days building, creating, or leading?`,
      6: `SerenDipity is a verified room. To complete your profile, share anything that helps us confirm your background — a LinkedIn, a website, a company name, or academic affiliation.\n\nYou can share as much or as little as you're comfortable with.`,
      7: `SerenDipity never forces a label on what you're looking for.\n\nWhat kind of connections are you open to? Choose what resonates — or write it in your own words below.`,
      8: `Is there anything else you'd like your circle to know about you?\n\nA current obsession, a question you're sitting with, something that makes you you. This is yours to shape.`,
      9: `One more question — and this one stays entirely with you.\n\nIs there anything you're truly hoping to find here that you'd prefer to keep private? What you share here is yours alone. SerenDipity will never reveal it — we'll only use it to find you better connections.`,
      closing: `Your profile is ready, and your circle is waiting.\n\nOnce our team has confirmed your details — usually within 24 to 48 hours — you'll have full access to your SerenDipity room.\n\nThe Oxbridge Mayball is on the 27th. We'll make sure you're not walking in alone.`,
    },
    zh: {
      1: `欢迎来到 SerenDipity。今晚——以及之后的每一个房间——都从这里开始。\n\n在我们将你介绍给你的圈子之前，我们想先了解一下你。\n\n你叫什么名字？`,
      2: `${name ? `很高兴认识你，${name}。` : '很高兴认识你。'} 你现在定居哪个城市？`,
      3: `请上传一张照片，用于你的名片——这是你的圈子第一次看到你的方式。一张有你个人风格的照片。\n\n（你也可以稍后在个人资料中添加。）`,
      4: `每个好的房间背后都有一段故事。你在哪里求学？`,
      5: `那你目前在做什么？在构建、创造，还是领导什么？`,
      6: `SerenDipity 是一个经过验证的圈子。为了完善你的个人资料，请分享任何有助于我们确认你背景的信息——LinkedIn、个人网站、公司名称或学术机构。\n\n分享多少由你决定。`,
      7: `SerenDipity 从不强迫你给自己贴标签。\n\n你对哪类连接保持开放？选择与你共鸣的——或者用你自己的话写下来。`,
      8: `还有什么你想让你的圈子了解的吗？\n\n一个你目前着迷的事物，一个你正在思考的问题，或者某个让你成为你的东西。这是你自己的空间。`,
      9: `最后一个问题——这个只属于你。\n\n有没有什么你真正希望在这里找到、但更愿意保持私密的东西？你在这里分享的内容只属于你自己。SerenDipity 永远不会透露它——我们只会用它来为你找到更好的连接。`,
      closing: `你的个人资料已就绪，你的圈子正在等待。\n\n一旦我们的团队确认了你的信息——通常在 24 至 48 小时内——你将完全进入你的 SerenDipity 房间。\n\nOxbridge Mayball 在 27 日。我们会确保你不是独自走进来的。`,
    },
  }

  return messages[zh ? 'zh' : 'en'][q] || ''
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function TypewriterBubble({ text, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    const interval = setInterval(() => {
      idx.current++
      setDisplayed(text.slice(0, idx.current))
      if (idx.current >= text.length) {
        clearInterval(interval)
        onDone?.()
      }
    }, 16)
    return () => clearInterval(interval)
  }, [text])

  return <div className="ob-bubble concierge">{displayed}<span className="ob-cursor">▌</span></div>
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate  = useNavigate()
  const { lang, s } = useLang()

  const [q, setQ]                   = useState(1)           // current question 1–9
  const [messages, setMessages]     = useState([])          // chat history
  const [inputValue, setInputValue] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isTyping, setIsTyping]     = useState(false)       // show typing indicator
  const [isAnimating, setIsAnimating] = useState(false)     // block input during typewriter
  const [isDone, setIsDone]         = useState(false)       // show closing card
  const [answers, setAnswers]       = useState({
    name: '', city: '', photo: '', institution: '',
    profession: '', credentials: '', intents: [], quote: '', signals: '',
  })

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Answer field map per question
  const answerField = { 1:'name', 2:'city', 3:'photo', 4:'institution', 5:'profession', 6:'credentials', 7:'intents', 8:'quote', 9:'signals' }

  // ── On mount: start with Q1 ──
  useEffect(() => {
    setIsAnimating(true)
    const msg = getConciergeMessage(1, lang, {})
    setMessages([{ role: 'concierge', text: msg, q: 1 }])
  }, [])

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, isDone])

  // ── Toggle tag ──
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // ── Submit an answer ──
  const submitAnswer = (rawValue) => {
    const value = rawValue?.trim() || ''
    if (!value && q !== 3 && q !== 7) return

    const field = answerField[q]
    const newAnswers = { ...answers, [field]: q === 7 ? selectedTags : value }
    setAnswers(newAnswers)

    // Add member bubble
    const displayText = q === 3
      ? (lang === 'zh' ? '（跳过照片）' : '(Skipping photo for now)')
      : q === 7
        ? (selectedTags.length > 0 ? selectedTags.join(' · ') : value)
        : value

    const newMessages = [...messages, { role: 'member', text: displayText, q }]
    setMessages(newMessages)
    setInputValue('')
    setSelectedTags([])

    const nextQ = q + 1

    if (nextQ > 9) {
      // Done — save & show closing
      setTimeout(() => {
        setIsDone(true)
        const profile = {
          zhName: newAnswers.name, enName: newAnswers.name,
          city: newAnswers.city, school: newAnswers.institution,
          industry: newAnswers.profession,
          intents: newAnswers.intents,
          quote: newAnswers.quote,
          credentials: newAnswers.credentials,
          hiddenSignals: newAnswers.signals,
        }
        saveUser(profile)
        saveUserToFirestore(profile).catch(e => console.warn('Firestore save failed:', e))
      }, 600)
      return
    }

    // Show typing indicator, then next concierge message
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const nextMsg = getConciergeMessage(nextQ, lang, newAnswers)
      setMessages(prev => [...prev, { role: 'concierge', text: nextMsg, q: nextQ }])
      setIsAnimating(true)
      setQ(nextQ)
    }, 900 + Math.random() * 400)
  }

  const handleSend = () => {
    if (isAnimating || isTyping) return
    if (q === 7) {
      if (selectedTags.length === 0 && !inputValue.trim()) return
      submitAnswer(inputValue.trim() ? [...selectedTags, inputValue.trim()].join(', ') : null)
    } else {
      submitAnswer(inputValue)
    }
  }

  const chapter = CHAPTERS[q] || 'YOUR SIGNALS'
  const progress = PROGRESS[q] || 0
  const tags = INTENT_TAGS[lang] || INTENT_TAGS.en

  return (
    <div className="ob-page">

      {/* ── Sticky header ── */}
      <div className="ob-header">
        <div className="ob-header-inner">
          <button className="ob-header-back" onClick={() => navigate('/intro')}>‹</button>
          <div className="ob-header-logo"><span>✦</span>SerenDipity</div>
          <span className="ob-header-chapter">{chapter}</span>
        </div>
        <div className="ob-progress-track">
          <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="ob-chat-scroll">

        {/* Render chapter dividers and messages */}
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1]
          const showChapter = msg.role === 'concierge' &&
            (!prevMsg || CHAPTERS[msg.q] !== CHAPTERS[prevMsg?.q])

          return (
            <div key={i}>
              {showChapter && (
                <p className="ob-chapter-label">{CHAPTERS[msg.q]}</p>
              )}
              <div className={`ob-bubble-row ${msg.role}`}>
                {msg.role === 'concierge' && (
                  <div className="ob-avatar-dot">✦</div>
                )}
                {/* Last concierge message gets typewriter effect */}
                {msg.role === 'concierge' && i === messages.filter(m => m.role === 'concierge').length - 1 + messages.filter(m => m.role === 'member').length
                  ? <div className="ob-bubble concierge">{msg.text}</div>
                  : msg.role === 'concierge'
                    ? (i === messages.length - 1 && isAnimating
                      ? <TypewriterBubble text={msg.text} onDone={() => setIsAnimating(false)} />
                      : <div className="ob-bubble concierge">{msg.text}</div>)
                    : <div className="ob-bubble member">{msg.text}</div>
                }
              </div>

              {/* Show tag pills right after the Q7 concierge message, before member replies */}
              {msg.role === 'concierge' && msg.q === 7 && q === 7 && !isAnimating && !isTyping && (
                <div className="ob-tags-wrap">
                  {tags.map(tag => (
                    <button key={tag}
                      className={`ob-tag-pill ${selectedTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}>
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="ob-typing">
            <div className="ob-avatar-dot">✦</div>
            <div className="ob-typing-dots">
              <div className="ob-typing-dot" />
              <div className="ob-typing-dot" />
              <div className="ob-typing-dot" />
            </div>
          </div>
        )}

        {/* Closing card */}
        {isDone && (
          <div className="ob-closing-card">
            <span className="ob-closing-star">✦</span>
            {getConciergeMessage('closing', lang, answers).split('\n').map((line, i) => (
              line ? <p key={i}>{line}</p> : <br key={i} />
            ))}
            <button className="ob-enter-btn" onClick={() => navigate('/directory')}>
              {lang === 'zh' ? '进入我的圈子 →' : 'Enter My Circle →'}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area (hidden after done) ── */}
      {!isDone && (
        <div className="ob-input-area">

          {q === 7 && selectedTags.length > 0 && (
            <p className="ob-input-hint">
              {lang === 'zh'
                ? `已选 ${selectedTags.length} 项 · 或在下方补充`
                : `${selectedTags.length} selected · or add your own below`}
            </p>
          )}

          {q === 3 ? (
            /* Photo step — skip for now */
            <>
              <button className="ob-skip-btn" onClick={() => submitAnswer('')}>
                {lang === 'zh' ? '跳过，稍后添加照片' : 'Skip for now — add photo later'}
              </button>
            </>
          ) : q === 7 ? (
            /* Intent step — tags + optional freeform + confirm */
            <>
              <div className="ob-input-row">
                <input
                  ref={inputRef}
                  className="ob-input"
                  placeholder={lang === 'zh' ? '或者用你自己的话描述…' : 'Or describe it in your own words…'}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                />
              </div>
              <button
                className="ob-tags-confirm"
                disabled={selectedTags.length === 0 && !inputValue.trim()}
                onClick={handleSend}>
                {lang === 'zh' ? '确认，继续 →' : 'Confirm & continue →'}
              </button>
            </>
          ) : (
            /* Normal text input */
            <div className="ob-input-row">
              <input
                ref={inputRef}
                className="ob-input"
                placeholder={lang === 'zh' ? '在这里输入…' : 'Type here…'}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !isAnimating && !isTyping) handleSend() }}
                disabled={isAnimating || isTyping}
              />
              <button
                className="ob-send-btn"
                onClick={handleSend}
                disabled={!inputValue.trim() || isAnimating || isTyping}>
                <span className="ob-send-icon">→</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
