import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { myProfile } from '../data'
import { loadUser } from '../userStorage'
import './MyProfilePage.css'

const AVATAR_COLORS = ['#4A3A5A','#3D5A7A','#5A3D7A','#7A4A3D','#3D7A6B','#6B4A7A']

function getInitials(enName, zhName) {
  if (enName && enName.trim()) {
    return enName.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
  }
  if (zhName && zhName.trim()) return zhName.trim().slice(0, 2)
  return 'SD'
}
function getColor(name) {
  let hash = 0
  for (const c of (name || 'SD')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function MyProfilePage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()

  const saved = loadUser()
  const p = saved || myProfile
  const initials = saved ? getInitials(p.enName, p.zhName) : myProfile.initials
  const color    = saved ? getColor(p.enName || p.zhName)  : myProfile.color

  const primaryName   = p.zhName || p.enName || '—'
  const secondaryName = p.enName && p.enName !== primaryName ? p.enName : ''
  const schoolLabel   = p.school || p.schoolEn || '—'
  const intents       = p.intents || []
  const quote         = lang === 'en' ? (p.quoteEn || p.quote || '') : (p.quote || p.quoteEn || '')

  const rows = [
    { icon: '💼', label: s.myRowLabels[1], value: p.industry || '' },
    { icon: '📍', label: s.myRowLabels[3], value: lang === 'en' ? (p.cityEn || p.city || '') : (p.city || p.cityEn || '') },
  ].filter(r => r.value.trim())

  return (
    <div className="my-page">

      {/* Header */}
      <div className="my-header">
        <span className="my-eyebrow">{s.oxbridgeCircle}</span>
        <span className="my-header-star">✦</span>
      </div>

      <h1 className="my-page-title serif">{s.myTitle}</h1>
      <div className="my-page-rule" />
      <p className="my-page-sub">{s.mySubtitle}</p>

      {/* Identity card — dark plum */}
      <div className="my-card">
        <div className="my-avatar" style={{background: color}}>{initials}</div>
        <h2 className="my-zh-name serif">{primaryName}</h2>
        {secondaryName && <p className="my-en-name serif">{secondaryName}</p>}
        <div className="my-card-divider">
          <div className="my-card-divider-line" />
          <span className="my-card-diamond">◆</span>
          <div className="my-card-divider-line" />
        </div>
        <div className="my-school-row">
          <span className="my-school-text">
            {schoolLabel}{p.college ? ` · ${p.college}` : ''}
          </span>
        </div>
        {p.checkInNumber && (
          <div className="my-checkin-badge">
            ✦ #{String(p.checkInNumber).padStart(3, '0')}
          </div>
        )}
      </div>

      {/* Info rows */}
      {rows.length > 0 && (
        <div className="my-section">
          <p className="my-section-label">{lang === 'en' ? 'Details' : '资料'}</p>
          <div className="my-info-card">
            {rows.map(r => (
              <div key={r.label} className="my-info-row">
                <span className="my-info-icon">{r.icon}</span>
                <span className="my-info-label">{r.label}</span>
                <span className="my-info-value">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intent + quote */}
      <div className="my-section">
        <p className="my-section-label">{s.myIntentTitle}</p>
        <div className="my-intent-card">
          <div className="my-intent-header">
            <span className="my-intent-star">✦</span>
            <span className="my-intent-title">{lang === 'en' ? 'What brings you here' : '我来这里是因为'}</span>
          </div>

          {intents.length > 0 ? (
            <div className="my-intent-tags">
              {intents.map(intent => (
                <span key={intent} className="my-intent-tag">{intent}</span>
              ))}
            </div>
          ) : (
            <p className="my-intent-empty" onClick={() => navigate('/onboarding')}>
              {lang === 'en' ? 'Tap Edit to add your intentions →' : '点击编辑添加你的意向 →'}
            </p>
          )}

          {quote && (
            <div className="my-quote-wrap">
              <span className="my-quote-mark open">"</span>
              <p className="my-quote serif">{quote}</p>
              <span className="my-quote-mark close">"</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="my-actions">
        <button className="my-edit-btn" onClick={() => navigate('/onboarding')}>
          ✏ {s.myEdit}
        </button>
        <button className="my-inv-link" onClick={() => navigate('/invitations')}>
          {s.myViewInvitations}
        </button>
      </div>

    </div>
  )
}
