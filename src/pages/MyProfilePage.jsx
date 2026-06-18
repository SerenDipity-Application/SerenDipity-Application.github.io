import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { myProfile } from '../data'
import { loadUser } from '../userStorage'
import { uploadProfilePhoto } from '../firestoreUsers'
import './MyProfilePage.css'

const INV_CODES = ['SD-MB-7A21', 'SD-MB-7A22', 'SD-MB-7A23', 'SD-MB-7A24', 'SD-MB-7A25']

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

  // Resolve profile first — used to initialise state below
  const saved = loadUser()
  const p = saved || myProfile
  const initials = saved ? getInitials(p.enName, p.zhName) : myProfile.initials
  const color    = saved ? getColor(p.enName || p.zhName)  : myProfile.color

  const [copied, setCopied] = useState(null)
  const [photoURL, setPhotoURL] = useState(p.photoURL || null)
  const [uploading, setUploading] = useState(false)
  const [uploadToast, setUploadToast] = useState('') // '' | 'uploading' | 'done' | 'error'
  const fileInputRef = useRef(null)

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadToast('uploading')
    try {
      const url = await uploadProfilePhoto(file)
      setPhotoURL(url)
      setUploadToast('done')
      setTimeout(() => setUploadToast(''), 2500)
    } catch (err) {
      console.error('Photo upload failed:', err)
      setUploadToast('error')
      setTimeout(() => setUploadToast(''), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleShare = () => {
    const text = lang === 'zh'
      ? `我邀请你加入 SerenDipity。\n\n我的邀请码：\n${INV_CODES.join('\n')}`
      : `Join me on SerenDipity.\n\nMy invitation codes:\n${INV_CODES.join('\n')}`
    if (navigator.share) {
      navigator.share({ title: 'SerenDipity Invitation', text })
    } else {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopied('all')
      setTimeout(() => setCopied(null), 2000)
    }
  }

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

      {/* Photo upload toast */}
      {uploadToast && (
        <div className={`my-upload-toast my-upload-toast-${uploadToast}`}>
          {uploadToast === 'uploading' && (lang === 'zh' ? '上传中…' : 'Uploading photo…')}
          {uploadToast === 'done'      && (lang === 'zh' ? '✓ 头像已更新' : '✓ Photo updated')}
          {uploadToast === 'error'     && (lang === 'zh' ? '上传失败，请重试' : 'Upload failed — try again')}
        </div>
      )}

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
        {/* Tappable avatar — opens camera/photo picker */}
        <div className="my-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
          {photoURL
            ? <img src={photoURL} className="my-avatar my-avatar-photo" alt="profile" />
            : <div className="my-avatar" style={{ background: color }}>{initials}</div>
          }
          <div className="my-avatar-overlay">
            {uploading ? '…' : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
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

      {/* Edit action */}
      <div className="my-actions">
        <button className="my-edit-btn" onClick={() => navigate('/onboarding')}>
          ✏ {s.myEdit}
        </button>
      </div>

      {/* Invitations section */}
      <div className="my-section">
        <p className="my-section-label">{lang === 'zh' ? '邀请好友' : 'Invite Friends'}</p>
        <div className="my-inv-card">
          <p className="my-inv-desc">
            {lang === 'zh'
              ? '将以下邀请码发给你想带入圈子的朋友。'
              : 'Share these codes with friends you want to bring into the Circle.'}
          </p>
          <div className="my-inv-codes">
            {INV_CODES.map((code) => (
              <div key={code} className="my-inv-row">
                <span className="my-inv-code">{code}</span>
                <button
                  className={`my-inv-copy ${copied === code ? 'copied' : ''}`}
                  onClick={() => handleCopy(code)}
                >
                  {copied === code ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '复制' : 'Copy')}
                </button>
              </div>
            ))}
          </div>
          <button className="my-inv-share serif" onClick={handleShare}>
            {copied === 'all'
              ? (lang === 'zh' ? '已复制 ✓' : 'Copied ✓')
              : (lang === 'zh' ? '✦ 一键分享所有' : '✦ Share All Codes')}
          </button>
        </div>
      </div>

    </div>
  )
}
