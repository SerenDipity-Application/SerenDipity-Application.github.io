import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './IntroPage.css'

export default function IntroPage() {
  const navigate = useNavigate()
  const { lang, toggle, s } = useLang()

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
