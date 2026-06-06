import { useNavigate } from 'react-router-dom'
import { members } from '../data'
import './ChatPage.css'

const connected = [members[2], members[3]]

export default function ChatPage() {
  const navigate = useNavigate()
  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h1 className="chat-title serif">聊天</h1>
          <p className="chat-sub">{connected.length} 位联系人 · SerenDipity 在线</p>
        </div>
        <button className="chat-edit-btn">✏</button>
      </div>

      <div className="chat-ai-card" onClick={() => navigate('/ai-chat')}>
        <div className="chat-ai-pin">★</div>
        <div className="chat-ai-avatar">
          <span className="serif" style={{fontSize:20,color:' var(--gold)'}}>SD</span>
        </div>
        <div className="chat-ai-info">
          <div className="chat-ai-name-row">
            <span className="chat-ai-name">SerenDipity</span>
            <span className="chat-ai-badge">置顶</span>
            <span className="chat-ai-online">• 在线</span>
          </div>
          <p className="chat-ai-role">你的 AI 私人社交礼宾</p>
          <p className="chat-ai-preview">想认识谁，随时问我，我替你点名 ✦</p>
        </div>
      </div>

      <p className="chat-section-label">已连接的人</p>

      <div className="chat-list">
        {connected.map((m, i) => (
          <div key={m.id} className="chat-item" onClick={() => navigate(`/profile/${m.id}`)}>
            <div className="chat-item-avatar" style={{background: m.color}}>{m.initials}</div>
            <div className="chat-item-info">
              <div className="chat-item-name-row">
                <span className="chat-item-name">{m.zhName}</span>
                <span className="chat-item-time">{i === 0 ? '刚刚' : '09:42'}</span>
              </div>
              <p className="chat-item-school">{m.school} · {m.industry}</p>
              <p className="chat-item-preview">{i === 0 ? '哈哈，很高兴认识你！这场聚会能遇到同频…' : '期待下次的主题沙龙，我们再继续聊。'}</p>
            </div>
            {i === 0 && <div className="chat-unread">1</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
