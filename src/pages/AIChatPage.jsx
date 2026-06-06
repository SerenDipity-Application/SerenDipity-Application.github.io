import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import './AIChatPage.css'

export default function AIChatPage() {
  const navigate = useNavigate()
  const { s } = useLang()
  const [input, setInput] = useState('')
  const rec = members[3]

  return (
    <div className="ai-page">
      <div className="ai-header">
        <button className="ai-back" onClick={() => navigate('/chat')}>{s.back}</button>
        <div className="ai-header-avatar">
          <span className="serif" style={{fontSize:16,color:'var(--gold)'}}>SD</span>
        </div>
        <div>
          <p className="ai-header-name">SerenDipity</p>
          <p className="ai-header-sub">{s.chatAIRole}</p>
        </div>
        <span className="ai-online">{s.online}</span>
      </div>

      <div className="ai-body">
        <div className="ai-bubble ai-bubble-system">
          <p>{s.aiGreeting}</p>
        </div>

        <div className="ai-rec-card">
          <p className="ai-rec-label">{s.aiRecommended}</p>
          <div className="ai-rec-person">
            <div className="ai-rec-avatar" style={{background: rec.color}}>{rec.initials}</div>
            <div>
              <p className="ai-rec-name">{rec.zhName} <span className="ai-rec-en serif">{rec.enName}</span></p>
              <p className="ai-rec-info">🏛 {rec.school}大学 · 💼 {rec.industry}</p>
            </div>
          </div>
          <div className="ai-rec-reason">
            <p>{s.aiReason}</p>
          </div>
          <div className="ai-rec-actions">
            <button className="ai-ice-btn" onClick={() => navigate(`/icebreaker/${rec.id}`)}>{s.aiIceBtn}</button>
            <button className="ai-card-btn" onClick={() => navigate(`/profile/${rec.id}`)}>{s.aiCardBtn}</button>
          </div>
        </div>

        <div className="ai-bubble ai-bubble-system">
          <p>{s.aiFollowUp}</p>
        </div>

        <div className="ai-chips">
          {s.aiChips.map(c => (
            <button key={c} className="ai-chip">{c}</button>
          ))}
        </div>
      </div>

      <div className="ai-input-wrap">
        <input className="ai-input" placeholder={s.aiPlaceholder}
          value={input} onChange={e => setInput(e.target.value)} />
        <button className="ai-send">✈</button>
      </div>
    </div>
  )
}
