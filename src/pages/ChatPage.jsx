import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import './ChatPage.css'

const connected = [members[2], members[3]]

const previewsZH = [
  '哈哈，很高兴认识你！这场聚会能遇到同频…',
  '期待下次的主题沙龙，我们再继续聊。',
]
const previewsEN = [
  'Haha, so glad we connected! Great to meet someone on the same wavelength…',
  'Looking forward to the next salon — let\'s continue the conversation.',
]

export default function ChatPage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()
  const previews = lang === 'zh' ? previewsZH : previewsEN

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h1 className="chat-title serif">{s.chatTitle}</h1>
          <p className="chat-sub">{s.chatSub.replace('{n}', connected.length)}</p>
        </div>
      </div>

      <div className="chat-ai-card" onClick={() => navigate('/ai-chat')}>
        <div className="chat-ai-pin">★</div>
        <div className="chat-ai-avatar">
          <span className="serif" style={{fontSize:20,color:'var(--gold)'}}>SD</span>
        </div>
        <div className="chat-ai-info">
          <div className="chat-ai-name-row">
            <span className="chat-ai-name">{s.chatAIName}</span>
            <span className="chat-ai-badge">{s.chatAIBadge}</span>
            <span className="chat-ai-online">{s.online}</span>
          </div>
          <p className="chat-ai-preview">{s.chatAIPreview}</p>
        </div>
      </div>

      <p className="chat-section-label">{s.chatConnected}</p>

      <div className="chat-list">
        {connected.map((m, i) => (
          <div key={m.id} className="chat-item" onClick={() => navigate(`/profile/${m.id}`)}>
            <div className="chat-item-avatar" style={{background: m.color}}>{m.initials}</div>
            <div className="chat-item-info">
              <div className="chat-item-name-row">
                <span className="chat-item-name">{lang === 'en' ? m.enName : m.zhName}</span>
                <span className="chat-item-time">{i === 0 ? (lang === 'zh' ? '刚刚' : 'Just now') : '09:42'}</span>
              </div>
              <p className="chat-item-school">{lang === 'en' ? m.schoolEn : m.school} · {m.industry}</p>
              <p className="chat-item-preview">{previews[i]}</p>
            </div>
            {i === 0 && <div className="chat-unread">1</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
