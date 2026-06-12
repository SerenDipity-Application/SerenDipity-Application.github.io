import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './EntryPage.css'

export default function EntryPage() {
  const navigate  = useNavigate()
  const { lang, toggle, s } = useLang()
  const envRef    = useRef(null)

  const [phase, setPhase]       = useState('idle')
  const [cardRect, setCardRect] = useState(null)

  const handleEnter = () => {
    if (phase !== 'idle') return
    const rect = envRef.current.getBoundingClientRect()
    setCardRect(rect)
    setPhase('flap')
    setTimeout(() => setPhase('rise'),   650)
    setTimeout(() => setPhase('expand'), 1050)
    setTimeout(() => navigate('/intro'), 1950)
  }

  const cardStyle = cardRect ? {
    '--env-top':    cardRect.top    + 'px',
    '--env-left':   cardRect.left   + 'px',
    '--env-width':  cardRect.width  + 'px',
    '--env-height': cardRect.height + 'px',
  } : {}

  return (
    <div className={`entry-root phase-${phase}`}>

      {/* ── HERO ── */}
      <div className="entry-hero">
        <div className="entry-invite-pill">{s.entryBadge}</div>
        <img src="/logo.jpg" className="entry-logo" alt="SerenDipity" />
        <h1 className="entry-event-title serif">{s.entryEventTitle}</h1>
        <p className="entry-event-desc">{s.entryDesc1}</p>
        <div className="entry-meta">
          <span className="entry-meta-item">📅 {s.entryDate}</span>
          <div className="entry-meta-dot" />
          <span className="entry-meta-item">📍 {s.entryCity}</span>
        </div>
      </div>

      {/* ── SKYLINE + ENVELOPE ── */}
      <div className="entry-skyline-wrap">
<div className="env-wrap" ref={envRef}>
          <div className="env-back" />
          <div className="env-body">
            <div className="env-left"  />
            <div className="env-right" />
            <div className="env-bottom"/>
          </div>
          <div className="env-flap">
            <div className="env-flap-inner" />
          </div>
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div className="entry-bottom">
        <button className="entry-btn serif" onClick={handleEnter} disabled={phase !== 'idle'}>
          {phase !== 'idle'
            ? (lang === 'zh' ? '正在进入…' : 'Opening…')
            : <>{s.entryBtn} <span className="entry-btn-arrow">→</span></>}
        </button>
        <p className="entry-invitation-only">{s.entryInvitationOnly}</p>
      </div>

      {/* ── CARD OVERLAY ── */}
      {cardRect && (
        <div className="entry-card-overlay" style={cardStyle}>
          <IntroContent navigate={navigate} s={s} lang={lang} toggle={toggle} />
        </div>
      )}

    </div>
  )
}

/* Inline intro content for the envelope reveal animation */
function IntroContent({ navigate, s, lang, toggle }) {
  return (
    <div className="intro-page">
      <div className="intro-app-icon">
        <span className="intro-app-star">✦</span>
      </div>

      <p className="intro-eyebrow">SerenDipity</p>
      <h1 className="intro-title serif">{s.introTitle}</h1>
      <p className="intro-subtitle">{s.introSubtitle}</p>

      <div className="intro-divider" />

      <div className="intro-features">
        <div className="intro-feature-row">
          <div className="intro-feature-icon">🔒</div>
          <div className="intro-feature-text">
            <span className="intro-feature-label">{s.introFeature1Title}</span>
            <span className="intro-feature-desc">{s.introFeature1Desc}</span>
          </div>
        </div>
        <div className="intro-feature-row">
          <div className="intro-feature-icon">✦</div>
          <div className="intro-feature-text">
            <span className="intro-feature-label">{s.introFeature2Title}</span>
            <span className="intro-feature-desc">{s.introFeature2Desc}</span>
          </div>
        </div>
        <div className="intro-feature-row">
          <div className="intro-feature-icon">🛡</div>
          <div className="intro-feature-text">
            <span className="intro-feature-label">{s.introFeature3Title}</span>
            <span className="intro-feature-desc">{s.introFeature3Desc}</span>
          </div>
        </div>
      </div>

      <button className="intro-btn serif" onClick={() => navigate('/onboarding')}>
        {s.introBtn} <span style={{marginLeft:6}}>→</span>
      </button>
    </div>
  )
}
