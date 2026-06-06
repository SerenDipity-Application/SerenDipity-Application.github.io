import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { myProfile } from '../data'
import './MyProfilePage.css'

const intentStyle = {
  '结识朋友': { bg: '#EDE8F5', text: '#6B5A9A', icon: '👥' },
  '寻找合作': { bg: '#D4EDE7', text: '#3D7A6B', icon: '🤝' },
  'Make Friends':       { bg: '#EDE8F5', text: '#6B5A9A', icon: '👥' },
  'Find Collaborators': { bg: '#D4EDE7', text: '#3D7A6B', icon: '🤝' },
}

export default function MyProfilePage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()

  const zhToEn = {'结识朋友':'Make Friends','寻找合作':'Find Collaborators'}
  const displayIntents = myProfile.intents.map(i => lang === 'en' ? (zhToEn[i] || i) : i)

  const rows = [
    { icon: '💼', label: s.myRowLabels[0], value: myProfile.background },
    { icon: '📊', label: s.myRowLabels[1], value: myProfile.industry },
    { icon: '👤', label: s.myRowLabels[2], value: myProfile.role },
    { icon: '📍', label: s.myRowLabels[3], value: myProfile.city },
  ]

  return (
    <div className="my-page">
      <div className="my-header">
        <div className="my-logo serif">SerenDipity</div>
        <button className="my-grid-btn">⊞</button>
      </div>

      <h1 className="my-page-title serif">{s.myTitle}</h1>
      <div className="my-page-rule" />
      <p className="my-page-sub">{s.mySubtitle}</p>

      <div className="my-card">
        <div className="my-card-sparkle my-card-sparkle-1">✦</div>
        <div className="my-card-sparkle my-card-sparkle-2">✦</div>
        <div className="my-avatar" style={{background: myProfile.color}}>{myProfile.initials}</div>
        <h2 className="my-zh-name serif">{myProfile.zhName}</h2>
        <p className="my-en-name serif">{myProfile.enName}</p>
        <div className="my-card-divider">
          <div className="my-card-divider-line" />
          <span className="my-card-diamond">◆</span>
          <div className="my-card-divider-line" />
        </div>
        <div className="my-school-row">
          <span className="my-school-shield">🛡</span>
          <span className="my-school-text">{myProfile.school} | {myProfile.college}</span>
        </div>
        <div className="my-card-bg-wave" />
      </div>

      <div className="my-info-card">
        {rows.map(r => (
          <div key={r.label} className="my-info-row">
            <span className="my-info-icon">{r.icon}</span>
            <span className="my-info-label">{r.label}</span>
            <span className="my-info-value">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="my-intent-card">
        <div className="my-intent-header">
          <span>♡</span>
          <span className="my-intent-title">{s.myIntentTitle}</span>
          <button className="my-intent-edit" onClick={() => navigate('/onboarding')}>{s.myEdit}</button>
        </div>
        <div className="my-intent-tags">
          {displayIntents.map(intent => {
            const style = intentStyle[intent] || {bg:'#eee',text:'#666',icon:''}
            return (
              <span key={intent} className="my-intent-tag" style={{background:style.bg,color:style.text}}>
                {style.icon} {intent}
              </span>
            )
          })}
        </div>
        <div className="my-quote-wrap">
          <span className="my-quote-mark open">"</span>
          <p className="my-quote">{lang === 'en' ? myProfile.quoteEn : myProfile.quote}</p>
          <span className="my-quote-mark close">"</span>
        </div>
      </div>
    </div>
  )
}
