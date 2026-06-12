import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { saveUser } from '../userStorage'
import { saveUserToFirestore } from '../firestoreUsers'
import './OnboardingPage.css'

// ── Concierge script ──────────────────────────────────────────────────────────
// Follows serendipity_system_prompt.md exactly.
// Replace getConciergeMessage() with POST /api/concierge/message when backend ready.

const CHAPTERS = {
  en: {
    1: 'YOUR WORLD',  2: 'YOUR WORLD',  3: 'YOUR WORLD',
    4: 'YOUR STORY',  5: 'YOUR STORY',  6: 'YOUR STORY',
    7: 'YOUR INTENTIONS',
    8: 'YOUR SIGNALS', 9: 'YOUR SIGNALS',
  },
  zh: {
    1: '你的世界',  2: '你的世界',  3: '你的世界',
    4: '你的故事',  5: '你的故事',  6: '你的故事',
    7: '你的意向',
    8: '你的信号',  9: '你的信号',
  },
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

// Returns the concierge message for question q in the given language.
// Concierge messages are derived at render time — not stored as strings —
// so toggling language instantly re-translates every bubble.
function getConciergeMessage(q, lang, answers) {
  const zh = lang === 'zh'
  const name = answers.name ? answers.name.split(/\s+/)[0] : ''

  if (zh) {
    switch (q) {
      case 1:  return `欢迎来到 SerenDipity。今晚——以及之后的每一个房间——都从这里开始。\n\n在我们将你介绍给你的圈子之前，我们想先了解一下你。\n\n你叫什么名字？`
      case 2:  return `${name ? `很高兴认识你，${name}。` : '很高兴认识你。'} 你现在定居哪个城市？`
      case 3:  return `请为你的名片上传一张照片——这是你的圈子第一次看到你的方式。一张有你个人风格的照片。\n\n（你也可以稍后在个人资料中添加。）`
      case 4:  return `每个好的房间背后都有一段故事。你在哪里求学？`
      case 5:  return `那你目前在做什么？在构建、创造，还是领导什么？`
      case 6:  return `SerenDipity 是一个经过验证的圈子。为了完善你的个人资料，请分享任何有助于我们确认你背景的信息——LinkedIn、个人网站、公司名称或学术机构。\n\n分享多少由你决定。`
      case 7:  return `SerenDipity 从不强迫你给自己贴标签。\n\n你对哪类连接保持开放？选择与你共鸣的——或者用你自己的话写下来。`
      case 8:  return `还有什么你想让你的圈子了解的吗？\n\n一个你目前着迷的事物，一个你正在思考的问题，或者某个让你成为你的东西。这是你自己的空间。`
      case 9:  return `最后一个问题——这个只属于你。\n\n有没有什么你真正希望在这里找到、但更愿意保持私密的东西？你在这里分享的内容只属于你自己。SerenDipity 永远不会透露它——我们只会用它来为你找到更好的连接。`
      case 'closing': return `你的个人资料已就绪，你的圈子正在等待。\n\n一旦我们的团队确认了你的信息——通常在 24 至 48 小时内——你将完全进入你的 SerenDipity 房间。\n\nOxbridge Mayball 在 27 日。我们会确保你不是独自走进来的。`
      default: return ''
    }
  } else {
    switch (q) {
      case 1:  return `Welcome to SerenDipity. Tonight — and every room after this — begins here.\n\nBefore we introduce you to your circle, we'd love to know a little about you.\n\nWhat's your name?`
      case 2:  return `${name ? `Lovely, ${name}.` : 'Lovely.'} Which city do you call home right now?`
      case 3:  return `Upload a photo for your Connection Card — this is how your circle will first see you. One that feels like you.\n\n(You can skip this and add one later from your profile.)`
      case 4:  return `Every great room has a story behind it. Where did you study?`
      case 5:  return `And what do you spend your days building, creating, or leading?`
      case 6:  return `SerenDipity is a verified room. To complete your profile, share anything that helps us confirm your background — a LinkedIn, a website, a company name, or academic affiliation.\n\nYou can share as much or as little as you're comfortable with.`
      case 7:  return `SerenDipity never forces a label on what you're looking for.\n\nWhat kind of connections are you open to? Choose what resonates — or write it in your own words below.`
      case 8:  return `Is there anything else you'd like your circle to know about you?\n\nA current obsession, a question you're sitting with, something that makes you you. This is yours to shape.`
      case 9:  return `One more question — and this one stays entirely with you.\n\nIs there anything you're truly hoping to find here that you'd prefer to keep private? What you share here is yours alone. SerenDipity will never reveal it — we'll only use it to find you better connections.`
      case 'closing': return `Your profile is ready, and your circle is waiting.\n\nOnce our team has confirmed your details — usually within 24 to 48 hours — you'll have full access to your SerenDipity room.\n\nThe Oxbridge Mayball is on the 27th. We'll make sure you're not walking in alone.`
      default: return ''
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate  = useNavigate()
  const { lang }  = useLang()

  const [q, setQ]                       = useState(1)
  // messages store {role, q} for concierge and {role, text} for member
  // concierge text is re-derived at render time so language toggle re-translates instantly
  const [messages, setMessages]         = useState([{ role: 'concierge', q: 1 }])
  const [inputValue, setInputValue]     = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isTyping, setIsTyping]         = useState(false)
  const [isAnimating, setIsAnimating]   = useState(true)
  const [isDone, setIsDone]             = useState(false)
  const [answers, setAnswers]           = useState({
    name: '', city: '', photo: '', institution: '',
    profession: '', credentials: '', intents: [], quote: '', signals: '',
  })

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  // Track previous q to detect new concierge messages for animation
  const prevConciergeQ = useRef(1)

  const answerField = {
    1:'name', 2:'city', 3:'photo', 4:'institution',
    5:'profession', 6:'credentials', 7:'intents', 8:'quote', 9:'signals',
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, isDone])

  // Focus input when ready
  useEffect(() => {
    if (!isAnimating && !isTyping && !isDone && q !== 3 && q !== 7) {
      inputRef.current?.focus()
    }
  }, [isAnimating, isTyping, q, isDone])

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const submitAnswer = (rawValue) => {
    const value = rawValue?.trim() ?? ''
    if (!value && q !== 3 && q !== 7) return

    const field = answerField[q]
    const newAnswers = { ...answers, [field]: q === 7 ? selectedTags : value }
    setAnswers(newAnswers)

    // Member bubble always stores the display text (already in chosen lang at time of reply)
    const displayText = q === 3
      ? (lang === 'zh' ? '（稍后添加照片）' : '(Adding photo later)')
      : q === 7
        ? (selectedTags.length > 0 ? selectedTags.join(' · ') : value)
        : value

    setMessages(prev => [...prev, { role: 'member', text: displayText }])
    setInputValue('')
    setSelectedTags([])

    const nextQ = q + 1

    if (nextQ > 9) {
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

    // Show typing → add next concierge message (stores q, not text)
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      prevConciergeQ.current = nextQ
      setMessages(prev => [...prev, { role: 'concierge', q: nextQ }])
      setIsAnimating(true)
      setQ(nextQ)
    }, 900 + Math.random() * 400)
  }

  const handleSend = () => {
    if (isAnimating || isTyping) return
    if (q === 7) {
      if (selectedTags.length === 0 && !inputValue.trim()) return
      const combined = [...selectedTags, ...(inputValue.trim() ? [inputValue.trim()] : [])]
      submitAnswer(combined.join(', '))
    } else {
      submitAnswer(inputValue)
    }
  }

  const chapterMap = CHAPTERS[lang] || CHAPTERS.en
  const chapter = chapterMap[q] || chapterMap[9]
  const progress = PROGRESS[q] || 0
  const tags = INTENT_TAGS[lang] || INTENT_TAGS.en

  // Which concierge messages have finished animating
  const lastConciergeIdx = messages.reduce((acc, m, i) => m.role === 'concierge' ? i : acc, -1)

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

      {/* ── Chat scroll area ── */}
      <div className="ob-chat-scroll">

        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1]

          // Show chapter divider when chapter changes between concierge messages
          const showChapter = msg.role === 'concierge' && (
            !prevMsg ||
            (prevMsg.role === 'concierge' && chapterMap[msg.q] !== chapterMap[prevMsg.q]) ||
            (prevMsg.role === 'member' && i >= 2 && (() => {
              const prevConcierge = [...messages].slice(0, i).reverse().find(m => m.role === 'concierge')
              return prevConcierge && chapterMap[msg.q] !== chapterMap[prevConcierge.q]
            })())
          )

          // Concierge text is derived from q + current lang — auto-translates on toggle
          const bubbleText = msg.role === 'concierge'
            ? getConciergeMessage(msg.q, lang, answers)
            : msg.text

          const isLastConcierge = msg.role === 'concierge' && i === lastConciergeIdx

          return (
            <div key={i}>
              {showChapter && (
                <p className="ob-chapter-label">{chapterMap[msg.q]}</p>
              )}

              <div className={`ob-bubble-row ${msg.role}`}>
                {msg.role === 'concierge' && (
                  <div className="ob-avatar-dot">✦</div>
                )}
                {isLastConcierge && isAnimating
                  ? <TypewriterBubble text={bubbleText} onDone={() => setIsAnimating(false)} />
                  : <div className={`ob-bubble ${msg.role}`}>{bubbleText}</div>
                }
              </div>

              {/* Tag pills after Q7 concierge bubble */}
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

      {/* ── Input area ── */}
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
            <button className="ob-skip-btn" onClick={() => submitAnswer('')}>
              {lang === 'zh' ? '跳过，稍后添加照片' : 'Skip for now — add photo later'}
            </button>
          ) : q === 7 ? (
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

// ── Typewriter effect ─────────────────────────────────────────────────────────
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
    }, 14)
    return () => clearInterval(interval)
  }, [text])

  return <div className="ob-bubble concierge">{displayed}<span style={{opacity:0.5}}>▌</span></div>
}
