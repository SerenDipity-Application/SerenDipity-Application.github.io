import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { members } from '../data'
import './DirectoryPage.css'

const filters = ['全部', '结识朋友', '寻找合作', '商务对接', '寻觅伴侣']

const intentColorMap = {
  '寻找合作': { bg: '#D4EDE7', text: '#3D7A6B', dot: '#3D7A6B' },
  '结识朋友': { bg: '#E8E8E8', text: '#4A4A6A', dot: '#4A4A6A' },
  '商务对接': { bg: '#F5E6D0', text: '#B5713A', dot: '#B5713A' },
  '寻觅伴侣': { bg: '#F5E0DC', text: '#C4857A', dot: '#C4857A' },
}

export default function DirectoryPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('全部')
  const [search, setSearch] = useState('')

  const filtered = members.filter(m => {
    const matchFilter = activeFilter === '全部' || m.intents.includes(activeFilter)
    const matchSearch = !search ||
      m.zhName.includes(search) || m.enName.toLowerCase().includes(search.toLowerCase()) ||
      m.industry.includes(search) || m.intents.some(i => i.includes(search))
    return matchFilter && matchSearch
  })

  return (
    <div className="dir-page">
      <div className="dir-header">
        <div className="dir-header-top">
          <div className="dir-logo">
            <span className="dir-logo-circles">⊙</span>
            <span className="serif" style={{fontSize:13,color:'#8A8AA8',fontStyle:'italic'}}>The Oxbridge Circle</span>
          </div>
        </div>
        <h1 className="dir-title serif">本场名录</h1>
        <p className="dir-sub">上海牛剑聚会 · {members.length} 位校友在场</p>
      </div>

      <div className="dir-search-wrap">
        <span className="dir-search-icon">🔍</span>
        <input className="dir-search" placeholder="搜索姓名、行业、诉求…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="dir-filters">
        {filters.map(f => (
          <button key={f} className={`dir-filter ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="dir-list">
        {filtered.map(m => (
          <div key={m.id} className="dir-card">
            <div className="dir-card-left-bar" />
            <div className="dir-card-inner">
              <div className="dir-card-top">
                <div className="dir-avatar" style={{background: m.color}}>{m.initials}</div>
                <div className="dir-card-info">
                  <div className="dir-name-row">
                    <span className="dir-zh-name serif">{m.zhName}</span>
                    <span className="dir-en-name serif"> {m.enName}</span>
                  </div>
                  <p className="dir-school">
                    <span className="dir-dot" /> {m.school} {m.schoolEn} · {m.college} · {m.degree}
                  </p>
                  <p className="dir-company">{m.company} · {m.role}</p>
                  <div className="dir-tags">
                    {m.intents.map(intent => {
                      const c = intentColorMap[intent] || {bg:'#eee',text:'#666',dot:'#666'}
                      return (
                        <span key={intent} className="dir-tag" style={{background:c.bg,color:c.text}}>
                          <span style={{color:c.dot}}>•</span> {intent}
                        </span>
                      )
                    })}
                  </div>
                  <p className="dir-quote">「{m.quote}」</p>
                </div>
              </div>
              <div className="dir-card-actions">
                <button className="dir-greet-btn" onClick={() => navigate(`/icebreaker/${m.id}`)}>
                  一键打招呼 →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
