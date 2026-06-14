import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './IntroPage.css'

export default function IntroPage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()

  // "another" in gold, rest white — language-aware split
  const titleParts = lang === 'zh'
    ? { before: '不只是', accent: null, after: '\n社交软件。' }
    : { before: 'Not ', accent: 'another', after: '\nsocial app.' }

  return (
    <div className="intro-page">

      {/* ── Top bar ── */}
      <div className="intro-topbar">
        <div className="intro-topbar-brand">
          <span className="intro-topbar-star">✦</span>
          <span className="intro-topbar-name">SERENDIPITY</span>
        </div>
        <div className="intro-topbar-menu">
          <span /><span /><span />
        </div>
      </div>

      {/* ── App icon ── */}
      <div className="intro-icon-wrap">
        <img src="/logo-star.jpg" className="intro-app-icon" alt="SerenDipity" />
      </div>

      {/* ── Headline ── */}
      <h1 className="intro-title serif">
        {titleParts.before}
        {titleParts.accent && <span className="intro-title-accent">{titleParts.accent}</span>}
        {titleParts.after.split('\n').map((line, i) => (
          i === 0 ? line : <span key={i}><br />{line}</span>
        ))}
      </h1>

      {/* ── Gold divider with star ── */}
      <div className="intro-divider">
        <span className="intro-divider-line" />
        <span className="intro-divider-star">✦</span>
        <span className="intro-divider-line" />
      </div>

      {/* ── Subtitle ── */}
      <p className="intro-subtitle serif">{s.introSubtitle.split('.')[0]}.</p>

      {/* ── Body copy ── */}
      <p className="intro-body">
        {lang === 'zh'
          ? '认识未来的联创、合伙人、投资人、导师、朋友——也许还有某个温暖的人。'
          : 'Meet future co-founders, collaborators, investors, mentors, friends — and maybe something more.'}
      </p>

      {/* ── Feature rows ── */}
      <div className="intro-features">
        <div className="intro-feature-row">
          <div className="intro-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <div className="intro-feature-text">
            <span className="intro-feature-label">{s.introFeature1Title}</span>
            <span className="intro-feature-desc">{s.introFeature1Desc}</span>
          </div>
        </div>

        <div className="intro-feature-row">
          <div className="intro-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="intro-feature-text">
            <span className="intro-feature-label">{s.introFeature2Title}</span>
            <span className="intro-feature-desc">{s.introFeature2Desc}</span>
          </div>
        </div>

        <div className="intro-feature-row">
          <div className="intro-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="intro-feature-text">
            <span className="intro-feature-label">{s.introFeature3Title}</span>
            <span className="intro-feature-desc">{s.introFeature3Desc}</span>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <button className="intro-btn" onClick={() => navigate('/onboarding')}>
        {s.introBtn} <span className="intro-btn-arrow">→</span>
      </button>

    </div>
  )
}
