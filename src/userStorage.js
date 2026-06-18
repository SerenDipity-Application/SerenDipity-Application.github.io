const KEY = 'serendipity_user'

// ── Save & Load ──────────────────────────────────────────────────────────────

export function saveUser(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...profile, savedAt: new Date().toISOString() }))
  } catch (e) {
    console.warn('Could not save profile:', e)
  }
}

export function loadUser() {
  try {
    const raw = localStorage.getItem(KEY)
    const main = raw ? JSON.parse(raw) : null
    // If the main entry has a real name, it's complete — return it
    if (main && (main.zhName || main.enName)) return main
    // Fall back to serendipity_profile (written by Firestore onboarding functions)
    const fb = localStorage.getItem('serendipity_profile')
    if (fb) {
      const parsed = JSON.parse(fb)
      // Merge: prefer main's values (e.g. a newly-uploaded photoURL) over fallback
      return main ? { ...parsed, ...main } : parsed
    }
    return main
  } catch (e) {
    return null
  }
}

export function clearUser() {
  localStorage.removeItem(KEY)
}

// ── Exports ──────────────────────────────────────────────────────────────────

export function exportJSON(profile) {
  const data = JSON.stringify(profile, null, 2)
  download(data, 'serendipity-profile.json', 'application/json')
}

export function exportCSV(profile) {
  const fields = ['zhName', 'enName', 'school', 'city', 'industry', 'role', 'intents', 'quote']
  const header = fields.join(',')
  const row = fields.map(f => {
    const v = Array.isArray(profile[f]) ? profile[f].join('; ') : (profile[f] || '')
    return `"${String(v).replace(/"/g, '""')}"`
  }).join(',')
  download(header + '\n' + row, 'serendipity-profile.csv', 'text/csv')
}

export function exportVCard(profile) {
  const name = profile.enName || profile.zhName || 'SerenDipity User'
  const parts = name.trim().split(' ')
  const last = parts.length > 1 ? parts.pop() : ''
  const first = parts.join(' ')
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${last};${first};;;`,
    profile.industry ? `TITLE:${profile.industry}` : '',
    profile.city ? `ADR;TYPE=WORK:;;${profile.city};;;;` : '',
    profile.quote ? `NOTE:${profile.quote}` : '',
    `X-SERENDIPITY-SCHOOL:${profile.school || ''}`,
    `X-SERENDIPITY-INTENTS:${(profile.intents || []).join(', ')}`,
    'END:VCARD',
  ].filter(Boolean).join('\r\n')
  download(vcard, 'serendipity-profile.vcf', 'text/vcard')
}

function download(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
