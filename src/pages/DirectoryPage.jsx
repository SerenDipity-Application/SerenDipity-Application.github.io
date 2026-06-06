import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import './DirectoryPage.css'

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

export default function DirectoryPage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()
  const [activeFilter, setActiveFilter] = useState(0) // index into dirFilters
  const [search, setSearch] = useState('')

  const filtered = members.filter(m => {
    const filterLabel = s.dirFilters[activeFilter]
    const isAll = activeFilter === 0
    // map EN filter back to ZH intent for matching
    const zhFilterMap = { 'Make Friends':'结识朋友','Find Collaborators':'寻找合作','Business':'商务对接','Romance':'寻觅伴侣' }
    const matchFilter = isAll || m.intents.includes(filterLabel) || m.intents.includes(zhFilterMap[filterLabel])
    const q = search.toLowerCase()
    const matchSearch = !q ||
      m.zhName.includes(search) || m.enName.toLowerCase().includes(q) ||
      m.industry.includes(search) || m.intents.some(i => i.includes(search))
    return matchFilter && matchSearch
  })

  const displayIntents = (intents) => {
    if (lang === 'en') {
      const map = {'寻找合作':'Find Collaborators','结识朋友':'Make Friends','商务对接':'Business','寻觅伴侣':'Romance'}
      return intents.map(i => map[i] || i)
    }
    return intents
  }

  return (
    <div className="dir-page">
      <div className="dir-header">
        <div className="dir-header-top">
          <div className="dir-logo">
            <span className="dir-logo-circles">⊙</span>
            <span className="serif" style={{fontSize:13,color:'#8A8AA8',fontStyle:'italic'}}>{s.oxbridgeCircle}</span>
          </div>
        </div>
        <h1 className="dir-title serif">{s.dirTitle}</h1>
        <p className="dir-sub">{s.dirSub.replace('{n}', members.length)}</p>
      </div>

      <div className="dir-search-wrap">
        <span className="dir-search-icon">🔍</span>
        <input className="dir-search" placeholder={s.dirSearchPh}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="dir-filters">
        {s.dirFilters.map((f, i) => (
          <button key={f} className={`dir-filter ${activeFilter === i ? 'active' : ''}`}
            onClick={() => setActiveFilter(i)}>{f}</button>
        ))}
      </div>

      <div className="dir-list">
        {filtered.map(m => (
          <div key={m.id} className="dir-card" onClick={() => navigate(`/profile/${m.id}`)}>
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
                    <span className="dir-dot" />
                    {lang === 'en' ? m.schoolEn : m.school} · {m.college} · {m.degree}
                  </p>
                  <p className="dir-company">{m.company} · {lang === 'en' ? m.roleEn : m.role}</p>
                  <div className="dir-tags">
                    {displayIntents(m.intents).map(intent => {
                      const c = intentColorMap[intent] || {bg:'#eee',text:'#666',dot:'#666'}
                      return (
                        <span key={intent} className="dir-tag" style={{background:c.bg,color:c.text}}>
                          <span style={{color:c.dot}}>•</span> {intent}
                        </span>
                      )
                    })}
                  </div>
                  <p className="dir-quote">「{lang === 'en' ? m.quoteEn : m.quote}」</p>
                </div>
              </div>
              <div className="dir-card-actions">
                <button className="dir-greet-btn" onClick={e => { e.stopPropagation(); navigate(`/icebreaker/${m.id}`) }}>
                  {s.dirGreetBtn}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
