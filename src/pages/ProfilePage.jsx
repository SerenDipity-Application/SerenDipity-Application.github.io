import { useNavigate, useParams } from 'react-router-dom'
import { members } from '../data'
import './ProfilePage.css'

const intentColorMap = {
  '寻找合作': { bg: '#D4EDE7', text: '#3D7A6B', dot: '#3D7A6B' },
  '结识朋友': { bg: '#E8E8E8', text: '#4A4A6A', dot: '#4A4A6A' },
  '商务对接': { bg: '#F5E6D0', text: '#B5713A', dot: '#B5713A' },
  '寻觅伴侣': { bg: '#F5E0DC', text: '#C4857A', dot: '#C4857A' },
}

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const member = members.find(m => m.id === parseInt(id)) || members[0]

  return (
    <div className="profile-page">
      <div className="profile-dark-header">
        <button className="profile-close" onClick={() => navigate(-1)}>✕</button>
        <div className="profile-header-content">
          <div className="profile-avatar" style={{background: member.color}}>{member.initials}</div>
          <div>
            <h1 className="profile-zh-name serif">{member.zhName}</h1>
            <p className="profile-en-name serif">{member.enName}</p>
          </div>
        </div>
        <div className="profile-header-meta">
          <span className="profile-meta-item">🎓 {member.school} · {member.college}</span>
          <span className="profile-meta-item">📍 {member.city}</span>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-section">
          <p className="profile-section-label">诉求</p>
          <div className="profile-tags">
            {member.intents.map(intent => {
              const c = intentColorMap[intent] || {bg:'#eee',text:'#666',dot:'#666'}
              return (
                <span key={intent} className="profile-tag" style={{background:c.bg,color:c.text}}>
                  <span style={{color:c.dot}}>•</span> {intent}
                </span>
              )
            })}
          </div>
          <div className="profile-quote-block">
            <div className="profile-quote-bar" />
            <p className="profile-quote">「{member.quote}」</p>
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-section">
          <p className="profile-section-label">背景</p>
          <p className="profile-company">{member.company} · {member.role}</p>
          <p className="profile-industry">{member.industry} · {member.degree}</p>
          {member.about && <p className="profile-about-bg">{member.about}</p>}
        </div>

        <div className="profile-divider" />

        <div className="profile-section">
          <p className="profile-section-label">关于 TA</p>
          <p className="profile-about">{member.about}</p>
        </div>
      </div>

      <div className="profile-footer">
        <button className="profile-greet-btn" onClick={() => navigate(`/icebreaker/${member.id}`)}>
          ✦ 让 SerenDipity 帮我打招呼
        </button>
      </div>
    </div>
  )
}
