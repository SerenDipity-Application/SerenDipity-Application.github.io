import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import api from '../api'
import { useAuth } from '../AuthContext'
import './AIChatPage.css'

export default function AIChatPage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [rec, setRec] = useState(null)

  // Load a recommended user from the API (exclude self, pick first)
  useEffect(() => {
    api.users.list().then(users => {
      const others = (users || []).filter(u => u.uid !== user?.uid)
      setRec(others[0] || null)
    }).catch(() => setRec(null))
  }, [user?.uid])

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

        {rec ? (
          <div className="ai-rec-card">
            <p className="ai-rec-label">{s.aiRecommended}</p>
            <div className="ai-rec-person">
              <div className="ai-rec-avatar" style={{background: rec.photoURL ? 'transparent' : rec.color}}>
                {rec.photoURL
                  ? <img src={rec.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : (rec.initials || rec.username?.slice(0, 2).toUpperCase())
                }
              </div>
              <div>
                <p className="ai-rec-name">
                  {lang === 'zh' ? (rec.zhName || rec.username) : (rec.enName || rec.zhName || rec.username)}
                  {rec.enName && rec.zhName && <span className="ai-rec-en serif"> {rec.enName}</span>}
                </p>
                <p className="ai-rec-info">🏛 {rec.school || rec.schoolEn || '—'} · 💼 {rec.industry || rec.industryEn || '—'}</p>
              </div>
            </div>
            <div className="ai-rec-reason">
              <p>{s.aiReason}</p>
            </div>
            <div className="ai-rec-actions">
              <button className="ai-ice-btn" onClick={() => navigate(`/icebreaker/${rec.uid || rec.id}`)}>{s.aiIceBtn}</button>
              <button className="ai-card-btn" onClick={() => navigate(`/profile/${rec.uid || rec.id}`)}>{s.aiCardBtn}</button>
            </div>
          </div>
        ) : (
          <div className="ai-rec-card">
            <p className="ai-rec-label">{s.aiRecommended}</p>
            <div className="ai-rec-person" style={{justifyContent: 'center', padding: '20px 0'}}>
              <p style={{color: 'var(--text-light)', fontSize: 13}}>
                {lang === 'zh' ? '正在为你匹配合适的人选…' : 'Finding the best match for you…'}
              </p>
            </div>
          </div>
        )}

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
