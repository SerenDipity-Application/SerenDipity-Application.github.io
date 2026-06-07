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
        {/* Gate illustration behind envelope */}
        <img src="/gate.svg" className="entry-gate-img" alt="Oxbridge Gate" />

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
