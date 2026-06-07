import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './EntryPage.css'

export default function EntryPage() {
  const navigate  = useNavigate()
  const { lang, toggle, s } = useLang()
  const envRef    = useRef(null)

  // phases: idle → flap → rise → expand → done
  const [phase, setPhase]       = useState('idle')
  const [cardRect, setCardRect] = useState(null)   // envelope bounding box

  const handleEnter = () => {
    if (phase !== 'idle') return

    // Snapshot envelope position before any animation shifts it
    const rect = envRef.current.getBoundingClientRect()
    setCardRect(rect)

    setPhase('flap')
    setTimeout(() => setPhase('rise'),   650)   // card peeks up
    setTimeout(() => setPhase('expand'), 1050)  // card fills screen
    setTimeout(() => navigate('/intro'), 1950)  // seamless hand-off
  }

  // Inline vars drive the start position of the card overlay
  const cardStyle = cardRect ? {
    '--env-top':    cardRect.top    + 'px',
    '--env-left':   cardRect.left   + 'px',
    '--env-width':  cardRect.width  + 'px',
    '--env-height': cardRect.height + 'px',
  } : {}

  return (
    <div className={`entry-root phase-${phase}`}>

      {/* Language toggle */}
      <button className="entry-lang-toggle" onClick={toggle}>
        {lang === 'zh' ? 'EN' : '中文'}
      </button>

      {/* ── TOP: badge + crest + brand ── */}
      <div className="entry-top">
        <div className="entry-top-badge">
          <span className="crown">♛</span> {s.entryBadge}
        </div>
        <img src="/crest.svg" alt="SerenDipity Crest" className="entry-crest-img" />
        <h1 className="entry-brand serif">SerenDipity</h1>
        <p className="entry-sub serif">· The Oxbridge Circle ·</p>
        <div className="entry-divider" />
        <h2 className="entry-event serif">{s.entryEvent}</h2>
        <p className="entry-event-en serif">{s.entryEventCN}</p>
        <p className="entry-date">{s.entryDate}</p>
      </div>

      {/* ── MIDDLE: gate scene + envelope ── */}
      <div className="env-scene">
        <img src="/gate.svg" className="entry-gate-img" alt="Oxbridge Gate" />

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

      {/* ── BOTTOM: description + button ── */}
      <div className="entry-bottom">
        <div className="entry-footer-text">
          <p>{s.entryDesc1}</p>
          <p>{s.entryDesc2}</p>
        </div>
        <button className="entry-btn serif" onClick={handleEnter} disabled={phase !== 'idle'}>
          {phase !== 'idle' ? (lang === 'zh' ? '正在进入…' : 'Opening…') : s.entryBtn}
        </button>
        <p className="entry-wechat-note">{s.entryWechat}</p>
      </div>

      {/* ── CARD OVERLAY: rises from envelope → expands to fill screen ── */}
      {cardRect && (
        <div className="entry-card-overlay" style={cardStyle}>
          {/* IntroPage content embedded verbatim */}
          <div className="intro-page">
            <div className="intro-watercolor" />

            <div className="intro-logo-wrap">
              <div className="intro-logo-icon">
                <span className="serif" style={{fontSize:22,color:'#C4857A',fontStyle:'italic'}}>S</span>
                <span className="serif" style={{fontSize:22,color:'#C4857A',fontStyle:'italic',marginLeft:-4}}>D</span>
              </div>
              <span className="intro-logo-text serif">SerenDipity</span>
            </div>

            <div className="intro-divider-line" />

            <h1 className="intro-title serif">{s.introTitle}</h1>
            <div className="intro-title-rule" />

            <p className="intro-desc">
              {s.introDesc.split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 && <br/>}</span>
              ))}
            </p>

            <div className="intro-features">
              <div className="intro-feature">
                <div className="feature-icon">✉</div>
                <span>{s.introFeature1}</span>
              </div>
              <div className="intro-feature">
                <div className="feature-icon">📖</div>
                <span>{s.introFeature2}</span>
              </div>
              <div className="intro-feature">
                <div className="feature-icon">✦</div>
                <span>{s.introFeature3}</span>
              </div>
            </div>

            <div className="intro-event-badge">
              <span className="leaf">❧</span>
              {s.introBadge}
              <span className="leaf">❧</span>
            </div>

            <div className="intro-watercolor-bottom" />

            <button className="intro-btn serif" onClick={() => navigate('/onboarding')}>
              {s.introBtn}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
