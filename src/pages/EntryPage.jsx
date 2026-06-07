import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './EntryPage.css'

export default function EntryPage() {
  const navigate = useNavigate()
  const { lang, toggle, s } = useLang()
  const [phase, setPhase] = useState('idle') // idle → flap → unfurl → done

  const handleOpen = () => {
    if (phase !== 'idle') return
    setPhase('flap')                          // 1. open flap
    setTimeout(() => setPhase('unfurl'), 700) // 2. content unfurls
    setTimeout(() => setPhase('done'), 1800)  // 3. navigate
    setTimeout(() => navigate('/intro'), 1900)
  }

  return (
    <div className={`entry-root phase-${phase}`}>

      {/* ── Language toggle ── */}
      <button className="entry-lang-toggle" onClick={toggle}>
        {lang === 'zh' ? 'EN' : '中文'}
      </button>

      {/* ── Dark sky background ── */}
      <div className="entry-sky">
        {/* Skyline silhouette */}
        <svg className="entry-skyline-svg" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax meet">
          <rect x="14"  y="82" width="10" height="38" fill="#2A3E54"/>
          <rect x="26"  y="68" width="8"  height="52" fill="#2A3E54"/>
          <rect x="60"  y="34" width="20" height="86" fill="#2A3E54"/>
          <polygon points="70,34 80,16 90,34"          fill="#2A3E54"/>
          <rect x="100" y="50" width="8"  height="70" fill="#2A3E54"/>
          <polygon points="104,50 108,32 112,50"       fill="#2A3E54"/>
          <rect x="140" y="42" width="6"  height="78" fill="#2A3E54"/>
          <polygon points="143,42 146,22 149,42"       fill="#2A3E54"/>
          <rect x="168" y="38" width="26" height="82" fill="#2A3E54"/>
          <polygon points="181,38 181,18 194,38"       fill="#2A3E54"/>
          <rect x="220" y="44" width="5"  height="76" fill="#2A3E54"/>
          <polygon points="222.5,44 225,24 227.5,44"  fill="#2A3E54"/>
          <rect x="260" y="62" width="10" height="58" fill="#2A3E54"/>
          <rect x="310" y="72" width="14" height="48" fill="#2A3E54"/>
          <rect x="340" y="58" width="8"  height="62" fill="#2A3E54"/>
          <polygon points="344,58 348,40 352,58"       fill="#2A3E54"/>
          <rect x="365" y="80" width="10" height="40" fill="#2A3E54"/>
        </svg>
      </div>

      {/* ── Small envelope (sits in skyline zone) ── */}
      <div className="env-wrap" onClick={handleOpen}>
        {/* Envelope back */}
        <div className="env-back" />

        {/* Side & bottom triangles */}
        <div className="env-body">
          <div className="env-left"  />
          <div className="env-right" />
          <div className="env-bottom"/>
        </div>

        {/* Flap */}
        <div className="env-flap">
          <div className="env-flap-inner" />
        </div>

        {/* Tap prompt (hidden once opening) */}
        <div className="env-tap-hint">
          {lang === 'zh' ? '轻触开启' : 'Tap to open'}
        </div>
      </div>

      {/* ── Full-page content that unfurls out of the envelope ── */}
      <div className="env-content">
        <div className="env-content-inner">
          <button className="entry-lang-toggle entry-lang-toggle--content" onClick={toggle}>
            {lang === 'zh' ? 'EN' : '中文'}
          </button>

          <div className="entry-border-frame">
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

            <div className="entry-footer-text">
              <p>{s.entryDesc1}</p>
              <p>{s.entryDesc2}</p>
            </div>

            <button className="entry-btn serif" onClick={() => navigate('/intro')}>
              {s.entryBtn}
            </button>

            <p className="entry-wechat-note">{s.entryWechat}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
