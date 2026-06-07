import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './EntryPage.css'

export default function EntryPage() {
  const navigate = useNavigate()
  const { lang, toggle, s } = useLang()
  const [phase, setPhase] = useState('idle') // idle → flap → done

  const handleEnter = () => {
    if (phase !== 'idle') return
    setPhase('flap')
    setTimeout(() => setPhase('done'), 700)
    setTimeout(() => navigate('/intro'), 1000)
  }

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

      {/* ── MIDDLE: the envelope ── */}
      <div className="env-scene">
        {/* Skyline behind envelope */}
        <svg className="entry-skyline-svg" viewBox="0 0 400 90" preserveAspectRatio="xMidYMax meet">
          <rect x="14"  y="58" width="10" height="32" fill="#1E3448" opacity="0.8"/>
          <rect x="26"  y="46" width="8"  height="44" fill="#1E3448" opacity="0.8"/>
          <rect x="60"  y="18" width="20" height="72" fill="#1E3448" opacity="0.8"/>
          <polygon points="70,18 80,4  90,18"          fill="#1E3448" opacity="0.8"/>
          <rect x="100" y="34" width="8"  height="56" fill="#1E3448" opacity="0.8"/>
          <polygon points="104,34 108,18 112,34"       fill="#1E3448" opacity="0.8"/>
          <rect x="140" y="28" width="6"  height="62" fill="#1E3448" opacity="0.8"/>
          <polygon points="143,28 146,10 149,28"       fill="#1E3448" opacity="0.8"/>
          <rect x="168" y="24" width="26" height="66" fill="#1E3448" opacity="0.8"/>
          <polygon points="181,24 181,6  194,24"       fill="#1E3448" opacity="0.8"/>
          <rect x="220" y="30" width="5"  height="60" fill="#1E3448" opacity="0.8"/>
          <polygon points="222.5,30 225,12 227.5,30"  fill="#1E3448" opacity="0.8"/>
          <rect x="260" y="46" width="10" height="44" fill="#1E3448" opacity="0.8"/>
          <rect x="310" y="54" width="14" height="36" fill="#1E3448" opacity="0.8"/>
          <rect x="340" y="40" width="8"  height="50" fill="#1E3448" opacity="0.8"/>
          <polygon points="344,40 348,24 352,40"       fill="#1E3448" opacity="0.8"/>
          <rect x="365" y="62" width="10" height="28" fill="#1E3448" opacity="0.8"/>
        </svg>

        {/* The envelope */}
        <div className="env-wrap">
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

    </div>
  )
}
