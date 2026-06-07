import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members as demoMembers } from '../data'
import { subscribeToUsers } from '../firestoreUsers'
import './DirectoryPage.css'

const intentColorMap = {
  '寻找合作':           { bg: '#D4EDE7', text: '#3D7A6B', dot: '#3D7A6B' },
  '结识朋友':           { bg: '#E8E8E8', text: '#4A4A6A', dot: '#4A4A6A' },
  '商务对接':           { bg: '#F5E6D0', text: '#B5713A', dot: '#B5713A' },
  '商业机会':           { bg: '#F5E6D0', text: '#B5713A', dot: '#B5713A' },
  '浪漫邂逅':           { bg: '#F5E0DC', text: '#C4857A', dot: '#C4857A' },
  'Find Collaborators': { bg: '#D4EDE7', text: '#3D7A6B', dot: '#3D7A6B' },
  'Make Friends':       { bg: '#E8E8E8', text: '#4A4A6A', dot: '#4A4A6A' },
  'Business':           { bg: '#F5E6D0', text: '#B5713A', dot: '#B5713A' },
  'Romance':            { bg: '#F5E0DC', text: '#C4857A', dot: '#C4857A' },
}

// Derive initials + color from a real user record
const AVATAR_COLORS = ['#4A6B8A','#3D7A6B','#8B4A6B','#7A6B3D','#4A5E7A','#6B4A3D']
function getInitials(u) {
  if (u.initials) return u.initials
  const name = u.enName || u.zhName || ''
  if (!name) return 'SD'
  const words = name.trim().split(/\s+/)
  return words.length > 1
    ? words.map(w => w[0].toUpperCase()).slice(0,2).join('')
    : name.slice(0,2)
}
function getColor(u) {
  if (u.color) return u.color
  const name = u.enName || u.zhName || 'SD'
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function DirectoryPage() {
  const navigate = useNavigate()
  const { lang, s } = useLang()
  const [activeFilter, setActiveFilter] = useState(0)
  const [search, setSearch] = useState('')
  const [firestoreUsers, setFirestoreUsers] = useState(null) // null = loading
  const [error, setError] = useState(false)

  // Live Firestore listener
  useEffect(() => {
    let unsub
    try {
      unsub = subscribeToUsers(users => {
        setFirestoreUsers(users)
        setError(false)
      })
    } catch (e) {
      console.warn('Firestore unavailable, using demo data', e)
      setError(true)
    }
    return () => unsub?.()
  }, [])

  // Use real Firestore users if loaded, otherwise fall back to demo members
  const allUsers = firestoreUsers !== null
    ? firestoreUsers.length > 0 ? firestoreUsers : demoMembers
    : demoMembers

  const isLoading = firestoreUsers === null && !error

  // Filter + search
  const filtered = allUsers.filter(m => {
    const filterLabel = s.dirFilters[activeFilter]
    const isAll = activeFilter === 0
    const zhFilterMap = {
      'Make Friends':       '结识朋友',
      'Find Collaborators': '寻找合作',
      'Business':           '商业机会',
      'Romance':            '浪漫邂逅',
    }
    const intents = m.intents || []
    const matchFilter = isAll
      || intents.includes(filterLabel)
      || intents.includes(zhFilterMap[filterLabel])

    const q = search.toLowerCase()
    const zhName  = m.zhName  || ''
    const enName  = m.enName  || ''
    const industry = m.industry || ''
    const matchSearch = !q
      || zhName.includes(search)
      || enName.toLowerCase().includes(q)
      || industry.toLowerCase().includes(q)
      || intents.some(i => i.toLowerCase().includes(q))
    return matchFilter && matchSearch
  })

  // Normalize intent labels for display
  const displayIntents = (intents) => {
    if (lang === 'en') {
      const map = {
        '寻找合作': 'Find Collaborators',
        '结识朋友': 'Make Friends',
        '商业机会': 'Business',
        '商务对接': 'Business',
        '浪漫邂逅': 'Romance',
        '寻觅伴侣': 'Romance',
      }
      return (intents || []).map(i => map[i] || i)
    }
    return intents || []
  }

  return (
    <div className="dir-page">
      <div className="dir-header">
        <div className="dir-header-top">
          <div className="dir-logo">
            <span className="dir-logo-circles">⊙</span>
            <span className="serif" style={{fontSize:13,color:'#8A8AA8',fontStyle:'italic'}}>
              {s.oxbridgeCircle}
            </span>
          </div>
        </div>
        <h1 className="dir-title serif">{s.dirTitle}</h1>
        <p className="dir-sub">
          {isLoading
            ? (lang === 'en' ? 'Loading…' : '加载中…')
            : s.dirSub.replace('{n}', filtered.length)}
        </p>
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
        {isLoading && (
          <p style={{textAlign:'center',color:'#aaa',padding:'40px 0'}}>
            {lang === 'en' ? 'Loading members…' : '正在加载成员…'}
          </p>
        )}

        {filtered.map((m, idx) => {
          const id       = m.uid || m.id || idx
          const initials = getInitials(m)
          const color    = getColor(m)
          const name1    = m.zhName || m.enName || '—'
          const name2    = m.enName || ''
          const school   = lang === 'en' ? (m.schoolEn || m.school || '') : (m.school || m.schoolEn || '')
          const role     = lang === 'en' ? (m.roleEn   || m.role   || '') : (m.role   || m.roleEn   || '')
          const industry = m.industry || ''
          const quote    = lang === 'en' ? (m.quoteEn  || m.quote  || '') : (m.quote  || m.quoteEn  || '')
          const intents  = displayIntents(m.intents)

          return (
            <div key={id} className="dir-card"
              onClick={() => navigate(m.uid ? `/profile/uid/${m.uid}` : `/profile/${m.id}`)}>
              <div className="dir-card-left-bar" />
              <div className="dir-card-inner">
                <div className="dir-card-top">
                  <div className="dir-avatar" style={{background: color}}>{initials}</div>
                  <div className="dir-card-info">
                    <div className="dir-name-row">
                      <span className="dir-zh-name serif">{name1}</span>
                      {name2 && name2 !== name1 && (
                        <span className="dir-en-name serif"> {name2}</span>
                      )}
                    </div>
                    {school && (
                      <p className="dir-school">
                        <span className="dir-dot" />
                        {school}{m.college ? ` · ${m.college}` : ''}
                      </p>
                    )}
                    {(industry || role) && (
                      <p className="dir-company">
                        {industry}{industry && role ? ' · ' : ''}{role}
                      </p>
                    )}
                    {intents.length > 0 && (
                      <div className="dir-tags">
                        {intents.map(intent => {
                          const c = intentColorMap[intent] || {bg:'#eee',text:'#666',dot:'#666'}
                          return (
                            <span key={intent} className="dir-tag"
                              style={{background:c.bg, color:c.text}}>
                              <span style={{color:c.dot}}>•</span> {intent}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {quote && <p className="dir-quote">「{quote}」</p>}
                  </div>
                </div>
                <div className="dir-card-actions">
                  <button className="dir-greet-btn"
                    onClick={e => {
                      e.stopPropagation()
                      navigate(m.uid ? `/icebreaker/uid/${m.uid}` : `/icebreaker/${m.id}`)
                    }}>
                    {s.dirGreetBtn}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
