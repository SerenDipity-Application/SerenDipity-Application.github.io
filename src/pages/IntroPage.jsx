import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './IntroPage.css'

const FEATURES = [
  { img: '/icon-curated.jpg',     labelEn: 'Curated Circle',        labelZh: '精选圈子' },
  { img: '/icon-concierge.jpg',   labelEn: 'AI Concierge',          labelZh: 'AI 礼宾' },
  { img: '/icon-connections.jpg', labelEn: 'Meaningful Connections', labelZh: '有意义的连接' },
  { img: '/icon-private.jpg',     labelEn: 'Private by Design',     labelZh: '隐私至上' },
]

export default function IntroPage() {
  const navigate = useNavigate()
  const { lang } = useLang()

  return (
    <div className="intro-page">

      {/* Background starfield */}
      <div className="intro-bg" />

      {/* Top bar */}
      <div className="intro-topbar">
        <div className="intro-topbar-brand">
          <img src="/logo-star.png" className="intro-topbar-icon" alt="✦" />
          <span className="intro-topbar-name">SERENDIPITY</span>
        </div>
        <div className="intro-topbar-menu">
          <span /><span /><span />
        </div>
      </div>

      {/* App icon with shiny gold border */}
      <div className="intro-icon-border">
        <div className="intro-icon-inner">
          <img src="/logo-star.png" className="intro-icon-img" alt="SerenDipity" />
        </div>
      </div>

      {/* Wordmark */}
      <h1 className="intro-wordmark">
        {lang === 'zh'
          ? <><span className="intro-wordmark-white">Seren</span><span className="intro-wordmark-gold">Dipity</span></>
          : <><span className="intro-wordmark-white">Seren</span><span className="intro-wordmark-gold">Dipity</span></>
        }
      </h1>

      {/* Divider */}
      <div className="intro-divider">
        <div className="intro-divider-line" />
        <span className="intro-divider-star">✦</span>
        <div className="intro-divider-line" />
      </div>

      {/* Headline */}
      <p className="intro-headline">
        {lang === 'zh' ? '遇见最好的人。' : 'Meet the best people.'}
      </p>

      {/* Subtitle */}
      <p className="intro-subtitle">
        {lang === 'zh'
          ? '一个拥有 AI 礼宾服务的线上社交俱乐部。'
          : 'An online social club\nwith AI Concierge.'}
      </p>

      {/* Body */}
      <p className="intro-body">
        {lang === 'zh'
          ? '认识未来的联创、合伙人、投资人、导师、朋友——也许还有某个特别的人。'
          : 'Meet future co-founders, collaborators, investors, mentors, friends – and maybe something more.'}
      </p>

      {/* 2×2 feature grid */}
      <div className="intro-features">
        {FEATURES.map(f => (
          <div key={f.labelEn} className="intro-feature-cell">
            <img src={f.img} className="intro-feature-img" alt={f.labelEn} />
            <span className="intro-feature-label">
              {lang === 'zh' ? f.labelZh : f.labelEn}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button className="intro-btn" onClick={() => navigate('/auth')}>
        {lang === 'zh' ? '探索本场圈子' : 'Explore The Circle'} <span className="intro-btn-arrow">→</span>
      </button>

    </div>
  )
}
