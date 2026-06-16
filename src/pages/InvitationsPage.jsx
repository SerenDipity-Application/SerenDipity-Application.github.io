import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './InvitationsPage.css'

const CODES = ['SD-MB-7A21', 'SD-MB-7A22', 'SD-MB-7A23', 'SD-MB-7A24', 'SD-MB-7A25']

export default function InvitationsPage() {
  const { lang, s } = useLang()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(null)

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleShare = () => {
    const text = lang === 'zh'
      ? `我邀请你加入 SerenDipity — 上海牛剑聚会独家社交圈。\n\n我的邀请码：\n${CODES.join('\n')}\n\n注册时输入邀请码即可加入。`
      : `I'd like to invite you to SerenDipity — the exclusive circle for the Oxbridge Shanghai Gathering.\n\nMy invitation codes:\n${CODES.join('\n')}\n\nEnter your code during registration to join.`
    if (navigator.share) {
      navigator.share({ title: 'SerenDipity Invitation', text })
    } else {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopied('all')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div className="inv-page">

      {/* Header */}
      <div className="inv-header">
        <span className="inv-eyebrow">THE OXBRIDGE CIRCLE</span>
        <span className="inv-star">✦</span>
      </div>

      <h1 className="inv-title serif">{s.invTitle}</h1>
      <p className="inv-subtitle">{s.invSubtitle}</p>

      {/* Codes */}
      <div className="inv-codes">
        {CODES.map((code, i) => (
          <div key={code} className="inv-code-row">
            <span className="inv-code-num">{i + 1}</span>
            <span className="inv-code">{code}</span>
            <button
              className={`inv-copy-btn ${copied === code ? 'copied' : ''}`}
              onClick={() => handleCopy(code)}
            >
              {copied === code ? s.invCopied : s.invCopy}
            </button>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="inv-how">
        <p className="inv-how-title">
          <span className="inv-how-star">✦</span> {s.invHowTitle}
        </p>
        <div className="inv-steps">
          {[s.invStep1, s.invStep2, s.invStep3].map((step, i) => (
            <div key={i} className="inv-step">
              <span className="inv-step-num">{i + 1}</span>
              <span className="inv-step-text">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer copy */}
      <div className="inv-footer-text">
        <p>{s.invFooter}</p>
      </div>

      {/* Share button */}
      <div className="inv-actions">
        <button className="inv-share-btn serif" onClick={handleShare}>
          {copied === 'all' ? (lang === 'zh' ? '已复制 ✓' : 'Copied ✓') : `✦ ${s.invShareBtn}`}
        </button>
        <button className="inv-my-card-link" onClick={() => navigate('/my-profile')}>
          {lang === 'zh' ? '← 返回我的卡片' : '← Back to My Card'}
        </button>
      </div>

    </div>
  )
}
