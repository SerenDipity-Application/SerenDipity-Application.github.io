import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members as demoMembers } from '../data'
import { subscribeToUsers } from '../firestoreUsers'
import './DirectoryPage.css'

const AVATAR_COLORS = ['#4A3A5A','#3D5A7A','#5A3D7A','#7A4A3D','#3D7A6B','#6B4A7A']

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
  const [firestoreUsers, setFirestoreUsers] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let unsub
    try {
      unsub = subscribeToUsers(
        users => { setFirestoreUsers(users); setError(false) },
        () => { setError(true); setFirestoreUsers([]) }
      )
    } catch (e) {
      console.warn('Firestore unavailable, using demo data', e)
      setError(true)
      setFirestoreUsers([])
    }
    return () => unsub?.()
  }, [])

  // Show Firestore users when loaded, fall back to demo members
  const allUsers = (firestoreUsers && firestoreUsers.length > 0)
    ? firestoreUsers
    : demoMembers

  const isLoading = firestoreUsers === null && !error

  const intentFilterMap = {
    // EN filter labels → matching intent strings
    'Friendship':      ['结识朋友', 'Make Friends', '拓展我的圈子', 'Expand My Circle'],
    'Collaboration':   ['寻找合作', '寻找合作伙伴', 'Find Collaborators', '创造一些事物', 'Build Something'],
    'Investing':       ['商业机会', '商务对接', '探索机会', 'Explore Opportunities', '投资'],
    'Relationship':    ['浪漫邂逅', '寻觅伴侣', 'Meet Someone Special', '遇见特别的人'],
    // ZH filter labels → same sets
    '结识朋友':         ['结识朋友', 'Make Friends', '拓展我的圈子', 'Expand My Circle'],
    '寻找合作':         ['寻找合作', '寻找合作伙伴', 'Find Collaborators', '创造一些事物', 'Build Something'],
    '投资':             ['商业机会', '商务对接', '探索机会', 'Explore Opportunities', '投资'],
    '约会':             ['浪漫邂逅', '寻觅伴侣', 'Meet Someone Special', '遇见特别的人'],
  }

  const filtered = allUsers.filter(m => {
    // hide truly incomplete profiles (no display name or "SD" placeholder)
    const name = m.zhName || m.enName || ''
    if (!name || name === 'SD') return false
    const filterLabel = s.dirFilters[activeFilter]
    const isAll = activeFilter === 0
    const intents = m.intents || []
    const variants = intentFilterMap[filterLabel] || []
    const matchFilter = isAll
      || intents.includes(filterLabel)
      || variants.some(v => intents.includes(v))

    const q = search.toLowerCase()
    const matchSearch = !q
      || (m.zhName || '').includes(search)
      || (m.enName || '').toLowerCase().includes(q)
      || (m.industry || '').toLowerCase().includes(q)
      || intents.some(i => i.toLowerCase().includes(q))
    return matchFilter && matchSearch
  })

  const displayIntents = (intents) => {
    if (lang === 'en') {
      const map = {
        '寻找合作': 'Find Collaborators', '寻找合作伙伴': 'Find Collaborators',
        '结识朋友': 'Make Friends',
        '商业机会': 'Business', '商务对接': 'Business', '探索机会': 'Explore',
        '浪漫邂逅': 'Romance', '寻觅伴侣': 'Romance', '遇见特别的人': 'Meet Someone',
        '创造一些事物': 'Build', '拓展我的圈子': 'Expand Circle',
      }
      return (intents || []).map(i => map[i] || i)
    }
    return intents || []
  }

  return (
    <div className="dir-page">

      {/* Header */}
      <div className="dir-header">
        <div className="dir-header-top">
          <span className="dir-eyebrow">{s.oxbridgeCircle}</span>
          <span className="dir-logo-star">✦</span>
        </div>
        <h1 className="dir-title serif">{s.dirTitle}</h1>
        <p className="dir-city-line">{s.dirCity}</p>
        <p className="dir-sub">{s.dirSub.replace('{n}', filtered.length)}</p>
      </div>

      {/* Search */}
      <div className="dir-search-wrap">
        <span className="dir-search-icon">🔍</span>
        <input className="dir-search" placeholder={s.dirSearchPh}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div className="dir-filters">
        {s.dirFilters.map((f, i) => (
          <button key={f} className={`dir-filter ${activeFilter === i ? 'active' : ''}`}
            onClick={() => setActiveFilter(i)}>{f}</button>
        ))}
      </div>

      {/* List */}
      <div className="dir-list">
        {filtered.map((m, idx) => {
          const id       = m.uid || m.id || idx
          const initials = getInitials(m)
          const color    = getColor(m)
          const name1    = m.zhName || m.enName || '—'
          const name2    = m.enName && m.enName !== name1 ? m.enName : ''
          const school   = lang === 'en' ? (m.schoolEn || m.school || '') : (m.school || m.schoolEn || '')
          const role     = lang === 'en' ? (m.roleEn   || m.role   || m.industry || '') : (m.role || m.roleEn || m.industry || '')
          const quote    = lang === 'en' ? (m.quoteEn  || m.quote  || '') : (m.quote  || m.quoteEn  || '')
          const intents  = displayIntents(m.intents)

          return (
            <div key={id} className="dir-card"
              onClick={() => navigate(`/profile/${m.uid || m.id}`, { state: { member: m } })}>

              {/* Avatar */}
              {m.photoURL
                ? <img src={m.photoURL} className="dir-avatar dir-avatar-photo" alt={initials} />
                : <div className="dir-avatar" style={{background: color}}>{initials}</div>
              }

              {/* Info */}
              <div className="dir-card-inner">
                <div className="dir-name-row">
                  <span className="dir-zh-name serif">{name1}</span>
                  {name2 && <span className="dir-en-name serif">{name2}</span>}
                </div>
                {role && <p className="dir-role-line">{role}</p>}
                {school && <p className="dir-school-line">{school}{m.college ? ` · ${m.college}` : ''}</p>}

                {intents.length > 0 && (
                  <div className="dir-tags-row">
                    <span className="dir-tags-label">{lang === 'en' ? 'Looking for' : '寻找'}</span>
                    {intents.slice(0, 3).map(intent => (
                      <span key={intent} className="dir-tag">{intent}</span>
                    ))}
                  </div>
                )}

                {quote && <p className="dir-quote">"{quote}"</p>}

                <div className="dir-card-actions">
                  <button className="dir-greet-btn"
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/icebreaker/${m.uid || m.id}`, { state: { member: m } })
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
