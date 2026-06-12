import { useNavigate, useParams } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import './ProfilePage.css'

const intentColorMap = {
  '寻找合作': { bg: '#D4EDE7', text: '#3D7A6B', dot: '#3D7A6B' },
  '结识朋友': { bg: '#E8E8E8', text: '#4A4A6A', dot: '#4A4A6A' },
  '商务对接': { bg: '#F5E6D0', text: '#B5713A', dot: '#B5713A' },
  '寻觅伴侣': { bg: '#F5E0DC', text: '#C4857A', dot: '#C4857A' },
  'Find Collaborators': { bg: '#D4EDE7', text: '#3D7A6B', dot: '#3D7A6B' },
  'Make Friends':       { bg: '#E8E8E8', text: '#4A4A6A', dot: '#4A4A6A' },
  'Business':           { bg: '#F5E6D0', text: '#B5713A', dot: '#B5713A' },
  'Romance':            { bg: '#F5E0DC', text: '#C4857A', dot: '#C4857A' },
}

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, s } = useLang()
  const member = members.find(m => m.id === parseInt(id)) || members[0]

  const zhToEn = {'寻找合作':'Find Collaborators','结识朋友':'Make Friends','商务对接':'Business','寻觅伴侣':'Romance'}
  const displayIntents = member.intents.map(i => lang === 'en' ? (zhToEn[i] || i) : i)

  return (
    <div className="profile-page">
      <div className="profile-dark-header">
        <button className="profile-close" onClick={() => navigate(-1)}>{s.close}</button>
        <div className="profile-header-content">
          <div className="profile-avatar" style={{background: member.color}}>{member.initials}</div>
          <div>
            <h1 className="profile-zh-name serif">{member.zhName}</h1>
            <p className="profile-en-name serif">{member.enName}</p>
          </div>
        </div>
        <div className="profile-header-meta">
          <span className="profile-meta-item">🎓 {lang === 'en' ? member.schoolEn : member.school} · {member.college}</span>
          <span className="profile-meta-item">📍 {member.city}</span>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-section">
          <p className="profile-section-label">{s.profileIntents}</p>
          <div className="profile-tags">
            {displayIntents.map(intent => {
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
            <p className="profile-quote">「{lang === 'en' ? member.quoteEn : member.quote}」</p>
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-section">
          <p className="profile-section-label">{s.profileBackground}</p>
          <p className="profile-company">{member.company} · {lang === 'en' ? member.roleEn : member.role}</p>
          <p className="profile-industry">{lang === 'en' ? member.industryEn : member.industry} · {lang === 'en' ? member.degreeEn : member.degree}</p>
        </div>

        <div className="profile-divider" />

        <div className="profile-section">
          <p className="profile-section-label">{s.profileAbout}</p>
          <p className="profile-about">{lang === 'en' ? member.aboutEn : member.about}</p>
        </div>
      </div>

      <div className="profile-footer">
        <button className="profile-greet-btn" onClick={() => navigate(`/icebreaker/${member.id}`)}>
          {s.profileGreetBtn}
        </button>
        <p className="profile-footer-hint">
          {lang === 'en'
            ? '✏ Choose an AI opener or write your own on the next screen'
            : '✏ 下一页可选 AI 开场白，或自己写一条'}
        </p>
      </div>
    </div>
  )
}
