import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './IntroPage.css'

export default function IntroPage() {
  const navigate = useNavigate()
  const { s } = useLang()

  return (
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
        {s.introDesc.split('\n').map((line, i) => (
          <span key={i}>{line}{i < s.introDesc.split('\n').length - 1 && <br/>}</span>
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
  )
}
