import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { members } from '../data'
import './IcebreakerPage.css'

const tones = [
  { key: 'recommended', label: '✦ 推荐', color: '#C9A84C' },
  { key: 'direct', label: '👥 直接友好', color: '#3D7A6B' },
  { key: 'casual', label: '🌿 轻松自然', color: '#8A8AA8' },
]

const messages = {
  recommended: (m) => `${m.zhName}你好！同是牛津的，刚在名录里看到你也在找合作——「${m.quote}」很想和你聊聊。`,
  direct: (m) => `${m.zhName}，冒昧打个招呼——我对你做的「${m.industry}」方向一直很有兴趣，想请教一下。`,
  casual: (m) => `嗨${m.zhName}，今天现场人太多没聊上聊，补一个招呼！你的诉求我记下了，下周想约杯咖啡。`,
}

export default function IcebreakerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const member = members.find(m => m.id === parseInt(id)) || members[0]
  const [activeTone, setActiveTone] = useState('recommended')
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(messages[activeTone](member))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ib-page">
      <div className="ib-header">
        <button className="ib-back" onClick={() => navigate(-1)}>‹</button>
        <span className="ib-header-label">SerenDipity</span>
        <span className="ib-online">• 在线</span>
      </div>

      <div className="ib-hero-text">
        <p className="ib-small-label">为你推荐的潜在合作对象</p>
      </div>

      <div className="ib-card">
        <div className="ib-card-header">
          <span className="ib-star">✦</span>
          <h2 className="ib-card-title serif">SerenDipity 帮你想了个开场白</h2>
        </div>
        <p className="ib-to">发给 <b>{member.zhName}</b> · 都是见过面的人，主动一点不会唐突。</p>

        <div className={`ib-message-box ${activeTone === 'recommended' ? 'gold' : ''}`}>
          {activeTone === 'recommended' && (
            <div className="ib-rec-label">✦ 推荐</div>
          )}
          <p className="ib-message">{messages[activeTone](member)}</p>
          {activeTone === 'recommended' && (
            <div className="ib-check">✓</div>
          )}
        </div>

        <p className="ib-tone-label">换一个语气</p>
        <div className="ib-tones">
          {tones.filter(t => t.key !== 'recommended').map(t => (
            <button key={t.key}
              className={`ib-tone-btn ${activeTone === t.key ? 'active' : ''}`}
              onClick={() => setActiveTone(t.key)}>
              <span className="ib-tone-title" style={{color: t.color}}>{t.label}</span>
              <p className="ib-tone-preview">{messages[t.key](member).slice(0, 30)}…</p>
            </button>
          ))}
        </div>
      </div>

      <div className="ib-actions">
        <button className="ib-copy-btn" onClick={copy}>{copied ? '已复制 ✓' : '复制'}</button>
        <button className="ib-send-btn serif" onClick={() => navigate('/chat')}>
          ✈ 发送招呼
        </button>
      </div>

      <p className="ib-disclaimer">🛡 建议由 SerenDipity 生成，真实表达由你决定</p>
    </div>
  )
}
