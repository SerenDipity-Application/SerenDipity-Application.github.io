import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { myProfile } from '../data'
import { loadUser, exportJSON, exportCSV, exportVCard } from '../userStorage'
import './MyProfilePage.css'

// Intent display config — covers both ZH and EN label variants
const intentStyle = {
  '结识朋友':           { bg: '#EDE8F5', text: '#6B5A9A', icon: '👥' },
  '寻找合作':           { bg: '#D4EDE7', text: '#3D7A6B', icon: '🤝' },
  '商业机会':           { bg: '#FDE8D8', text: '#B5713A', icon: '💼' },
  '浪漫邂逅':           { bg: '#FDE8EC', text: '#C4857A', icon: '♡'  },
  'Make Friends':       { bg: '#EDE8F5', text: '#6B5A9A', icon: '👥' },
  'Find Collaborators': { bg: '#D4EDE7', text: '#3D7A6B', icon: '🤝' },
  'Business':           { bg: '#FDE8D8', text: '#B5713A', icon: '💼' },
  'Romance':            { bg: '#FDE8EC', text: '#C4857A', icon: '♡'  },
}

// Derive initials from name: "Serena Zhang" → "SZ", "李明" → "李明"
function getInitials(enName, zhName) {
  if (enName && enName.trim()) {
    return enName.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
  }
  if (zhName && zhName.trim()) {
    return zhName.trim().slice(0, 2)
  }
  return 'SD'
}

// Pick a consistent color from name so it doesn't change on re-render
const AVATAR_COLORS = ['#4A6B8A','#3D7A6B','#8B4A6B','#7A6B3D','#4A5E7A','#6B4A3D']
function getColor(name) {
  let hash = 0
  for (const c of (name || 'SD')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function MyProfilePage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()

  // Use saved user data; fall back to demo profile only if nothing saved
  const saved = loadUser()
  const p = saved || myProfile

  const initials = saved ? getInitials(p.enName, p.zhName) : myProfile.initials
  const color    = saved ? getColor(p.enName || p.zhName)   : myProfile.color

  // Display name: show zhName as primary, enName as secondary
  const primaryName   = p.zhName   || p.enName   || '—'
  const secondaryName = p.enName   || p.zhName   || ''

  // School label
  const schoolLabel = p.school || (lang === 'en' ? p.schoolEn : null) || '—'
  const collegeLabel = p.college || ''

  // Info rows — only show rows that have a value
  const allRows = [
    { icon: '💼', label: s.myRowLabels[0], value: p.background || p.industry || '' },
    { icon: '📊', label: s.myRowLabels[1], value: p.industry   || '' },
    { icon: '👤', label: s.myRowLabels[2], value: lang === 'en' ? (p.roleEn || p.role || '') : (p.role || p.roleEn || '') },
    { icon: '📍', label: s.myRowLabels[3], value: lang === 'en' ? (p.cityEn || p.city || '') : (p.city || p.cityEn || '') },
  ]
  // Deduplicate: if background === industry, hide background row
  const rows = allRows.filter((r, i) => {
    if (i === 0 && r.value === allRows[1].value) return false  // skip duplicate background
    return r.value.trim() !== ''
  })

  // Intents: stored as ZH or EN depending on when user onboarded
  const intents = p.intents || []

  // Quote
  const quote = lang === 'en' ? (p.quoteEn || p.quote || '') : (p.quote || p.quoteEn || '')

  return (
    <div className="my-page">
      <div className="my-header">
        <div className="my-logo serif">SerenDipity</div>
        <button className="my-grid-btn" onClick={() => navigate('/onboarding')}>✏</button>
      </div>

      <h1 className="my-page-title serif">{s.myTitle}</h1>
      <div className="my-page-rule" />
      <p className="my-page-sub">{s.mySubtitle}</p>

      {/* Identity card */}
      <div className="my-card">
        <div className="my-card-sparkle my-card-sparkle-1">✦</div>
        <div className="my-card-sparkle my-card-sparkle-2">✦</div>
        <div className="my-avatar" style={{background: color}}>{initials}</div>
        <h2 className="my-zh-name serif">{primaryName}</h2>
        {secondaryName && secondaryName !== primaryName && (
          <p className="my-en-name serif">{secondaryName}</p>
        )}
        <div className="my-card-divider">
          <div className="my-card-divider-line" />
          <span className="my-card-diamond">◆</span>
          <div className="my-card-divider-line" />
        </div>
        <div className="my-school-row">
          <span className="my-school-shield">🛡</span>
          <span className="my-school-text">
            {schoolLabel}{collegeLabel ? ` | ${collegeLabel}` : ''}
          </span>
        </div>
        <div className="my-card-bg-wave" />
      </div>

      {/* Info rows */}
      {rows.length > 0 && (
        <div className="my-info-card">
          {rows.map(r => (
            <div key={r.label} className="my-info-row">
              <span className="my-info-icon">{r.icon}</span>
              <span className="my-info-label">{r.label}</span>
              <span className="my-info-value">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Intent + quote */}
      <div className="my-intent-card">
        <div className="my-intent-header">
          <span>♡</span>
          <span className="my-intent-title">{s.myIntentTitle}</span>
          <button className="my-intent-edit" onClick={() => navigate('/onboarding')}>{s.myEdit}</button>
        </div>

        {intents.length > 0 ? (
          <div className="my-intent-tags">
            {intents.map(intent => {
              const style = intentStyle[intent] || { bg: '#eee', text: '#666', icon: '' }
              return (
                <span key={intent} className="my-intent-tag"
                  style={{background: style.bg, color: style.text}}>
                  {style.icon} {intent}
                </span>
              )
            })}
          </div>
        ) : (
          <p className="my-intent-empty" onClick={() => navigate('/onboarding')}>
            {lang === 'en' ? 'Tap Edit to add your intentions →' : '点击编辑添加你的意向 →'}
          </p>
        )}

        {quote ? (
          <div className="my-quote-wrap">
            <span className="my-quote-mark open">"</span>
            <p className="my-quote">{quote}</p>
            <span className="my-quote-mark close">"</span>
          </div>
        ) : null}
      </div>

      {/* Export */}
      <div className="my-export-card">
        <p className="my-export-label">{lang === 'en' ? 'Download your profile' : '导出个人资料'}</p>
        <div className="my-export-btns">
          <button className="my-export-btn" onClick={() => exportJSON(p)}>JSON</button>
          <button className="my-export-btn" onClick={() => exportCSV(p)}>CSV</button>
          <button className="my-export-btn" onClick={() => exportVCard(p)}>vCard</button>
        </div>
      </div>
    </div>
  )
}
