import { useNavigate } from 'react-router-dom'
import './IntroPage.css'

export default function IntroPage() {
  const navigate = useNavigate()
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

      <h1 className="intro-title serif">SerenDipity 是什么？</h1>
      <div className="intro-title-rule" />

      <p className="intro-desc">
        一个邀请制的高质量社交圈。<br />
        你可以在这里认识朋友、合作伙伴、<br />
        同频的人，也可能遇见爱情。
      </p>

      <div className="intro-features">
        <div className="intro-feature">
          <div className="feature-icon">✉</div>
          <span>邀请制</span>
        </div>
        <div className="intro-feature">
          <div className="feature-icon">📖</div>
          <span>高质量名录</span>
        </div>
        <div className="intro-feature">
          <div className="feature-icon">✦</div>
          <span>AI 破冰推荐</span>
        </div>
      </div>

      <div className="intro-event-badge">
        <span className="leaf">❧</span>
        在 Oxbridge Mayball 2026，先从本场圈子开始。
        <span className="leaf">❧</span>
      </div>

      <div className="intro-watercolor-bottom" />

      <button className="intro-btn serif" onClick={() => navigate('/onboarding')}>
        继续 &rsaquo;
      </button>
    </div>
  )
}
