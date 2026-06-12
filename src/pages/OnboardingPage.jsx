import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { saveUser } from '../userStorage'
import { saveUserToFirestore } from '../firestoreUsers'
import './OnboardingPage.css'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { s } = useLang()
  const [step, setStep] = useState(0)
  const [otherSchool, setOtherSchool] = useState('')

  const [form, setForm] = useState({
    zhName: '', enName: '', school: '',
    industry: '', city: '', intents: [], quote: '',
  })

  const toggleIntent = (label) => {
    setForm(f => ({
      ...f,
      intents: f.intents.includes(label)
        ? f.intents.filter(i => i !== label)
        : [...f.intents, label]
    }))
  }

  const next = () => {
    if (step < 3) {
      setStep(st => st + 1)
    } else {
      const finalForm = {
        ...form,
        school: form.school === (s.obSchools[2]) ? otherSchool || form.school : form.school,
      }
      saveUser(finalForm)
      saveUserToFirestore(finalForm)
        .catch(e => console.warn('Firestore save failed:', e))
      navigate('/directory')
    }
  }

  const stepTitles = [
    { pre: s.obStep1Title, accent: s.obStep1Accent, post: '', sub: s.obStep1Sub },
    { pre: s.obStep2Title, accent: s.obStep2Accent, post: '', sub: s.obStep2Sub },
    { pre: s.obStep3Title, accent: s.obStep3Accent, post: '', sub: s.obStep3Sub },
    { pre: s.obStep4Title, accent: s.obStep4Accent, post: s.obStep4Tail, sub: s.obStep4Sub },
  ]
  const current = stepTitles[step]
  const icons = s.obIntentIcons || ['👥','🚀','💼','💕','🌐']
  const isOtherSchool = form.school === s.obSchools[2]

  return (
    <div className="ob-page">

      {/* Top bar */}
      <div className="ob-topbar">
        <button className="ob-back" onClick={() => step > 0 ? setStep(st => st - 1) : navigate('/intro')}>‹</button>
        <span className="ob-step-pill">Step {step + 1} of 4</span>
        <div className="ob-spacer" />
      </div>

      {/* Progress dots */}
      <div className="ob-dots">
        {s.obSteps.map((label, i) => (
          <>
            <div key={label} className="ob-dot-step">
              <div className={`ob-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
              <span className={`ob-dot-label ${i === step ? 'active' : ''}`}>{label}</span>
            </div>
            {i < s.obSteps.length - 1 && <div key={`line-${i}`} className="ob-dot-line" />}
          </>
        ))}
      </div>

      {/* Content */}
      <div className="ob-content">

        {/* Title */}
        <p className="ob-title-line">{current.pre}</p>
        <span className="ob-title-accent">{current.accent}{current.post && ` ${current.post}`}</span>
        <p className="ob-subtitle">{current.sub}</p>

        {/* Step 0 — Identity */}
        {step === 0 && (
          <>
            <div className="ob-field-group">
              <label className="ob-label">{s.obZhName}</label>
              <input className="ob-input" placeholder={s.obZhNamePh} value={form.zhName}
                onChange={e => setForm(f => ({...f, zhName: e.target.value}))} />
            </div>
            <div className="ob-field-group">
              <label className="ob-label">{s.obEnName}</label>
              <input className="ob-input" placeholder={s.obEnNamePh} value={form.enName}
                onChange={e => setForm(f => ({...f, enName: e.target.value}))} />
            </div>
            <div className="ob-field-group">
              <label className="ob-label">{s.obCity}</label>
              <input className="ob-input" placeholder={s.obCityPh} value={form.city}
                onChange={e => setForm(f => ({...f, city: e.target.value}))} />
            </div>
          </>
        )}

        {/* Step 1 — School */}
        {step === 1 && (
          <>
            {s.obSchools.map((school, i) => (
              <button key={i} className={`ob-school-btn ${form.school === school ? 'selected' : ''}`}
                onClick={() => setForm(f => ({...f, school}))}>
                <span>{school}</span>
                {form.school === school && <span className="ob-school-check">✓</span>}
              </button>
            ))}
            {isOtherSchool && (
              <input className="ob-other-input"
                placeholder="e.g. Imperial College London"
                value={otherSchool}
                onChange={e => setOtherSchool(e.target.value)} />
            )}
          </>
        )}

        {/* Step 2 — Background */}
        {step === 2 && (
          <div className="ob-field-group">
            <label className="ob-label">{s.obIndustry}</label>
            <input className="ob-input" placeholder={s.obIndustryPh} value={form.industry}
              onChange={e => setForm(f => ({...f, industry: e.target.value}))} />
          </div>
        )}

        {/* Step 3 — Intent */}
        {step === 3 && (
          <>
            <div className="ob-intent-grid">
              {s.obIntents.map((label, i) => (
                <button key={label}
                  className={`ob-intent-btn ${form.intents.includes(label) ? 'selected' : ''}`}
                  onClick={() => toggleIntent(label)}>
                  <span className="ob-intent-icon">{icons[i]}</span>
                  <span>{label}</span>
                  {form.intents.includes(label) && <span style={{marginLeft:'auto',color:'var(--plum)'}}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{marginTop: 20}}>
              <label className="ob-label">{s.obQuoteLabel}</label>
              <textarea className="ob-textarea" placeholder={s.obQuotePh}
                value={form.quote} onChange={e => setForm(f => ({...f, quote: e.target.value}))} />
              <p className="ob-hint">{s.obHint}</p>
            </div>
          </>
        )}
      </div>

      {/* CTA button */}
      <div className="ob-btn-wrap">
        <button className="ob-btn serif" onClick={next}>
          {step < 3 ? s.obNext : s.obFinish} <span>→</span>
        </button>
      </div>

    </div>
  )
}
