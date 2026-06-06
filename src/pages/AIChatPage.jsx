import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { members } from '../data'
import './AIChatPage.css'

const chips = ['这里有适合做联合创始人的人吗？', '我想认识做投资的', '有适合聊天的人吗？']

export default function AIChatPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const rec = members[3]

  return (
    <div className="ai-page">
      <div className="ai-header">
        <button className="ai-back" onClick={() => navigate('/chat')}>‹</button>
        <div className="ai-header-avatar">
          <span className="serif" style={{fontSize:16,color:'var(--gold)'}}>SD</span>
        </div>
        <div>
          <p className="ai-header-name">SerenDipity</p>
          <p className="ai-header-sub">你的私人社交礼宾</p>
        </div>
        <span className="ai-online">• 在线</span>
      </div>

      <div className="ai-body">
        <div className="ai-bubble ai-bubble-system">
          <p>你好，我是 SerenDipity。这场聚会我都会帮你留意着 —— 你想找合作，我先给你点个名：</p>
        </div>

        <div className="ai-rec-card">
          <p className="ai-rec-label">✦ 为你推荐</p>
          <div className="ai-rec-person">
            <div className="ai-rec-avatar" style={{background: rec.color}}>{rec.initials}</div>
            <div>
              <p className="ai-rec-name">{rec.zhName} <span className="ai-rec-en serif">{rec.enName}</span></p>
              <p className="ai-rec-info">🏛 {rec.school}大学 · 💼 {rec.industry}</p>
            </div>
          </div>
          <div className="ai-rec-reason">
            <p>你们都在关注AI应用的产品落地与商业化，他在平台建设与增长方面有丰富经验。</p>
          </div>
          <div className="ai-rec-actions">
            <button className="ai-ice-btn" onClick={() => navigate(`/icebreaker/${rec.id}`)}>✦ 帮我破冰</button>
            <button className="ai-card-btn" onClick={() => navigate(`/profile/${rec.id}`)}>🪪 名片</button>
          </div>
        </div>

        <div className="ai-bubble ai-bubble-system">
          <p>想认识什么样的人，直接问我就好。</p>
        </div>

        <div className="ai-chips">
          {chips.map(c => (
            <button key={c} className="ai-chip">{c}</button>
          ))}
        </div>
      </div>

      <div className="ai-input-wrap">
        <input className="ai-input" placeholder="问 SerenDipity 任何事…"
          value={input} onChange={e => setInput(e.target.value)} />
        <button className="ai-send">✈</button>
      </div>
    </div>
  )
}
