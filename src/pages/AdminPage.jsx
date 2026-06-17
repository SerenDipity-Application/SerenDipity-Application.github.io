import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeToUsers, adminUpdateUser, adminDeleteUser, assignCheckInNumber } from '../firestoreUsers'
import { clearAllNotifications } from '../firestoreNotifications'
import './AdminPage.css'

// ── Change this passcode before the event ─────────────────────────────────────
const ADMIN_PASSCODE = 'SD2026'

// ── CSV export helper ─────────────────────────────────────────────────────────
function downloadCSV(users) {
  const fields = ['checkInNumber','zhName','enName','school','city','industry','intents','quote','credentials','verified','flagged','updatedAt']
  const header = fields.join(',')
  const rows = users.map(u =>
    fields.map(f => {
      const v = Array.isArray(u[f]) ? u[f].join('; ') : (u[f] ?? '')
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(',')
  )
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `serendipity-registrants-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}

function downloadJSON(users) {
  const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `serendipity-registrants-${new Date().toISOString().slice(0,10)}.json`
  a.click()
}

// ── Login gate ────────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    if (input.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem('sd_admin', '1')
      onSuccess()
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <span className="adm-star">✦</span>
        <h1 className="adm-login-title">SerenDipity Admin</h1>
        <p className="adm-login-sub">Enter the admin passcode to continue</p>
        <input
          className={`adm-login-input ${error ? 'error' : ''}`}
          type="password"
          placeholder="Passcode"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
        />
        {error && <p className="adm-login-error">Incorrect passcode</p>}
        <button className="adm-login-btn" onClick={attempt}>Enter Admin Panel</button>
      </div>
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    zhName:    user.zhName    || '',
    enName:    user.enName    || '',
    school:    user.school    || '',
    city:      user.city      || '',
    industry:  user.industry  || '',
    quote:     user.quote     || '',
    credentials: user.credentials || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>Edit Registrant</h2>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal-body">
          {[
            ['Name (ZH)', 'zhName'], ['Name (EN)', 'enName'],
            ['School', 'school'], ['City', 'city'],
            ['Industry / Role', 'industry'], ['Credentials', 'credentials'],
          ].map(([label, key]) => (
            <div key={key} className="adm-field">
              <label className="adm-field-label">{label}</label>
              <input className="adm-field-input" value={form[key]}
                onChange={e => set(key, e.target.value)} />
            </div>
          ))}
          <div className="adm-field">
            <label className="adm-field-label">Quote / Intent description</label>
            <textarea className="adm-field-textarea" value={form.quote}
              onChange={e => set('quote', e.target.value)} />
          </div>
        </div>
        <div className="adm-modal-footer">
          <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn-primary" onClick={() => onSave(form)}>Save changes</button>
        </div>
      </div>
    </div>
  )
}

// ── Progress label helper ─────────────────────────────────────────────────────
function getProgressLabel(u) {
  const status = u.onboardingStatus
  if (!status || status === 'started') return null   // shown in status column instead
  const p = u.onboardingProgress || {}
  if (status === 'completed') return 'Complete'
  const q = p.questionsAnswered ?? (p.currentQ ? p.currentQ - 1 : 0)
  const chapter = p.currentChapter || ''
  return `Q${q}/9 · ${chapter}`
}

// ── Main admin panel ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('sd_admin'))
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | verified | unverified | flagged | started | in_progress | completed
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState({}) // uid → bool
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!authed) return
    const unsub = subscribeToUsers(u => {
      // Sort by checkInNumber if assigned, then by updatedAt desc
      setUsers(u.sort((a, b) => {
        if (a.checkInNumber && b.checkInNumber) return a.checkInNumber - b.checkInNumber
        if (a.checkInNumber) return -1
        if (b.checkInNumber) return 1
        return 0
      }))
    })
    return () => unsub?.()
  }, [authed])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // ── Actions ──
  const setVerified = async (uid, value) => {
    setSaving(s => ({ ...s, [uid]: true }))
    await adminUpdateUser(uid, { verified: value, flagged: value ? false : undefined })
    setSaving(s => ({ ...s, [uid]: false }))
    showToast(value ? '✓ Verified' : 'Verification removed')
  }

  const setFlagged = async (uid, value) => {
    setSaving(s => ({ ...s, [uid]: true }))
    await adminUpdateUser(uid, { flagged: value })
    setSaving(s => ({ ...s, [uid]: false }))
    showToast(value ? '⚑ Flagged' : 'Flag removed')
  }

  const handleAssignNumber = async (uid, currentNumber) => {
    const max = users.reduce((m, u) => Math.max(m, u.checkInNumber || 0), 0)
    const next = currentNumber || (max + 1)
    const input = window.prompt(`Assign check-in number to this registrant:`, String(next))
    if (!input) return
    const num = parseInt(input, 10)
    if (isNaN(num) || num < 1 || num > 999) { showToast('Invalid number (1–999)'); return }
    setSaving(s => ({ ...s, [uid]: true }))
    await assignCheckInNumber(uid, num)
    setSaving(s => ({ ...s, [uid]: false }))
    showToast(`✦ #${String(num).padStart(3,'0')} assigned`)
  }

  const handleAutoAssignAll = async () => {
    const unassigned = users.filter(u => !u.checkInNumber)
    if (!unassigned.length) { showToast('All registrants already have numbers'); return }
    if (!window.confirm(`Auto-assign sequential numbers to ${unassigned.length} unassigned registrant(s)?`)) return
    const max = users.reduce((m, u) => Math.max(m, u.checkInNumber || 0), 0)
    let n = max
    for (const u of unassigned) {
      n++
      await assignCheckInNumber(u.uid || u._docId, n)
    }
    showToast(`✦ Assigned ${unassigned.length} numbers`)
  }

  const handleDelete = async (uid, name) => {
    if (!window.confirm(`Delete registrant "${name}"? This cannot be undone.`)) return
    await adminDeleteUser(uid)
    showToast('Registrant deleted')
  }

  const handleResetTestData = async () => {
    if (!window.confirm('This will delete ALL Firestore notification docs and clear DM messages from this browser. Continue?')) return
    try {
      await clearAllNotifications()
      Object.keys(localStorage)
        .filter(k => k.startsWith('serendipity_'))
        .forEach(k => localStorage.removeItem(k))
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('serendipity_'))
        .forEach(k => sessionStorage.removeItem(k))
      showToast('✓ All test data cleared')
    } catch (e) {
      showToast('Error: ' + e.message)
    }
  }

  const handleSaveEdit = async (form) => {
    const uid = editingUser.uid || editingUser._docId
    setSaving(s => ({ ...s, [uid]: true }))
    await adminUpdateUser(uid, form)
    setSaving(s => ({ ...s, [uid]: false }))
    setEditingUser(null)
    showToast('✓ Changes saved')
  }

  // ── Filter + search ──
  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (u.zhName || '').toLowerCase().includes(q)
      || (u.enName || '').toLowerCase().includes(q)
      || (u.school || '').toLowerCase().includes(q)
      || (u.industry || '').toLowerCase().includes(q)
      || (u.city || '').toLowerCase().includes(q)
    const matchFilter =
      filter === 'all' ||
      (filter === 'verified'    && u.verified) ||
      (filter === 'unverified'  && !u.verified && !u.flagged) ||
      (filter === 'flagged'     && u.flagged) ||
      (filter === 'started'     && u.onboardingStatus === 'started') ||
      (filter === 'in_progress' && u.onboardingStatus === 'in_progress') ||
      (filter === 'completed'   && u.onboardingStatus === 'completed')
    return matchSearch && matchFilter
  })

  const stats = {
    total:       users.length,
    verified:    users.filter(u => u.verified).length,
    completed:   users.filter(u => u.onboardingStatus === 'completed').length,
    inProgress:  users.filter(u => u.onboardingStatus === 'in_progress').length,
    started:     users.filter(u => u.onboardingStatus === 'started').length,
    flagged:     users.filter(u => u.flagged).length,
    numbered:    users.filter(u => u.checkInNumber).length,
  }

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />

  return (
    <div className="adm-page">

      {/* Toast */}
      {toast && <div className="adm-toast">{toast}</div>}

      {/* Header */}
      <div className="adm-header">
        <div className="adm-header-left">
          <span className="adm-header-star">✦</span>
          <div>
            <h1 className="adm-header-title">SerenDipity Admin</h1>
            <p className="adm-header-sub">Oxbridge Mayball 2026 · Registrant Management</p>
          </div>
        </div>
        <div className="adm-header-right">
          <button className="adm-btn-ghost" onClick={() => navigate('/')}>← App</button>
          <button className="adm-btn-ghost" onClick={() => { sessionStorage.removeItem('sd_admin'); setAuthed(false) }}>Log out</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="adm-stats">
        {[
          { label: 'Total',       value: stats.total,      color: '#6B21A8' },
          { label: 'Completed',   value: stats.completed,  color: '#059669' },
          { label: 'In Progress', value: stats.inProgress, color: '#D97706' },
          { label: 'Just Started',value: stats.started,    color: '#9B7FA6' },
          { label: 'Verified',    value: stats.verified,   color: '#3D1A47' },
          { label: 'Flagged',     value: stats.flagged,    color: '#DC2626' },
          { label: 'Numbered',    value: stats.numbered,   color: '#C9A84C' },
        ].map(s => (
          <div key={s.label} className="adm-stat">
            <span className="adm-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="adm-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Search name, school, city, industry…"
          value={search} onChange={e => setSearch(e.target.value)} />

        <div className="adm-filters">
          {[
            { key: 'all',         label: 'All' },
            { key: 'completed',   label: '✓ Completed' },
            { key: 'in_progress', label: '◑ In Progress' },
            { key: 'started',     label: '○ Started' },
            { key: 'verified',    label: 'Verified' },
            { key: 'flagged',     label: '⚑ Flagged' },
          ].map(f => (
            <button key={f.key} className={`adm-filter ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="adm-toolbar-actions">
          <button className="adm-btn-secondary" onClick={handleAutoAssignAll}>
            ✦ Auto-number unassigned
          </button>
          <button className="adm-btn-secondary" onClick={() => downloadCSV(users)}>
            ↓ CSV
          </button>
          <button className="adm-btn-secondary" onClick={() => downloadJSON(users)}>
            ↓ JSON
          </button>
          <button className="adm-btn-danger" onClick={handleResetTestData}>
            ↺ Reset test data
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>School</th>
              <th>City</th>
              <th>Industry</th>
              <th>Intents</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="adm-empty">No registrants yet — data will appear here as people begin onboarding</td></tr>
            )}
            {filtered.map((u) => {
              const uid  = u.uid || u._docId
              const name = u.zhName || u.enName || '—'
              const isSaving = saving[uid]
              const obStatus = u.onboardingStatus || 'started'
              const progressLabel = getProgressLabel(u)

              return (
                <tr key={uid} className={u.flagged ? 'adm-row-flagged' : u.verified ? 'adm-row-verified' : ''}>
                  {/* Check-in number */}
                  <td>
                    <button className="adm-num-btn"
                      onClick={() => handleAssignNumber(uid, u.checkInNumber)}
                      title="Click to assign / change number">
                      {u.checkInNumber
                        ? <span className="adm-num-badge">#{String(u.checkInNumber).padStart(3,'0')}</span>
                        : <span className="adm-num-empty">—</span>}
                    </button>
                  </td>

                  {/* Name */}
                  <td>
                    <div className="adm-name">{name || <span style={{color:'#D1D5DB',fontStyle:'italic'}}>Not yet provided</span>}</div>
                    {u.enName && u.enName !== name && (
                      <div className="adm-name-sub">{u.enName}</div>
                    )}
                  </td>

                  <td>{u.school || <span className="adm-cell-empty">—</span>}</td>
                  <td>{u.city   || <span className="adm-cell-empty">—</span>}</td>
                  <td>{u.industry || <span className="adm-cell-empty">—</span>}</td>

                  {/* Intents */}
                  <td>
                    {(u.intents || []).length > 0
                      ? <div className="adm-tags">
                          {(u.intents || []).slice(0,3).map(t => (
                            <span key={t} className="adm-tag">{t}</span>
                          ))}
                        </div>
                      : <span className="adm-cell-empty">—</span>
                    }
                  </td>

                  {/* Onboarding progress */}
                  <td>
                    {obStatus === 'started' && (
                      <span className="adm-progress adm-progress-started">Just opened</span>
                    )}
                    {obStatus === 'in_progress' && progressLabel && (
                      <span className="adm-progress adm-progress-active">{progressLabel}</span>
                    )}
                    {obStatus === 'completed' && (
                      <span className="adm-progress adm-progress-done">✓ Complete</span>
                    )}
                    {!obStatus && <span className="adm-cell-empty">—</span>}
                  </td>

                  {/* Admin verification status badge */}
                  <td>
                    {u.verified
                      ? <span className="adm-badge adm-badge-verified">Verified</span>
                      : u.flagged
                        ? <span className="adm-badge adm-badge-flagged">Flagged</span>
                        : <span className="adm-badge adm-badge-pending">Pending</span>}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="adm-actions">
                      {!u.verified
                        ? <button className="adm-action-btn verify" disabled={isSaving}
                            onClick={() => setVerified(uid, true)} title="Verify">✓</button>
                        : <button className="adm-action-btn unverify" disabled={isSaving}
                            onClick={() => setVerified(uid, false)} title="Remove verification">✓</button>}

                      <button className={`adm-action-btn flag ${u.flagged ? 'flagged' : ''}`}
                        disabled={isSaving}
                        onClick={() => setFlagged(uid, !u.flagged)} title={u.flagged ? 'Unflag' : 'Flag'}>
                        ⚑
                      </button>

                      <button className="adm-action-btn edit"
                        onClick={() => setEditingUser(u)} title="Edit">✏</button>

                      <button className="adm-action-btn delete"
                        onClick={() => handleDelete(uid, name)} title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editingUser && (
        <EditModal
          user={editingUser}
          onSave={handleSaveEdit}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  )
}
