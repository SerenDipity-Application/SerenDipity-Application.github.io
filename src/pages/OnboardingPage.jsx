import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { saveUser } from '../userStorage'
import { saveUserToFirestore } from '../firestoreUsers'
import './OnboardingPage.css'

const intentIcons = ['👥', '🤝', '💼', '♡']
const intentColors = ['#6B8CAE', '#3D7A6B', '#B5713A', '#C4857A']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { s } = useLang()
  const [step, setStep] = useState(0)

  // Always start blank — no bleed from previous users on the same device
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
      saveUser(form)                  // persist to localStorage
      saveUserToFirestore(form)       // sync to Firestore
        .catch(e => console.warn('Firestore save failed:', e))
      navigate('/directory')
    }
  }

  return (
    <div className="ob-page">
      <div className="ob-header">
        <div className="ob-logo serif">SerenDipity</div>
        <span className="ob-sparkle">✦</span>
      </div>

      <div className="ob-progress-wrap">
        <button className="ob-back" onClick={() => step > 0 ? setStep(st => st - 1) : navigate('/intro')}>‹</button>
        <span className="ob-step-label serif">Step {step + 1} / 4</span>
        <div style={{width:24}}/>
      </div>

      <div className="ob-track">
        {s.obSteps.map((label, i) => (
          <div key={label} className={`ob-track-step ${i <= step ? 'done' : ''}`}>
            <div className="ob-dot" />
            <span>{label}</span>
          </div>
        ))}
        <div className="ob-track-line">
          <div className="ob-track-fill" style={{width: `${(step / 3) * 100}%`}} />
        </div>
      </div>

      <div className="ob-content">
        {step === 0 && (
          <>
            <h2 className="ob-title serif">{s.obStep1Title}</h2>
            <p className="ob-subtitle">{s.obStep1Sub}</p>
            <label className="ob-label">{s.obZhName}</label>
            <input className="ob-input" placeholder={s.obZhNamePh} value={form.zhName}
              onChange={e => setForm(f => ({...f, zhName: e.target.value}))} />
            <label className="ob-label">{s.obEnName}</label>
            <input className="ob-input" placeholder={s.obEnNamePh} value={form.enName}
              onChange={e => setForm(f => ({...f, enName: e.target.value}))} />
            <label className="ob-label">{s.obCity}</label>
            <input className="ob-input" placeholder={s.obCityPh} value={form.city}
              onChange={e => setForm(f => ({...f, city: e.target.value}))} />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="ob-title serif">{s.obStep2Title}</h2>
            <p className="ob-subtitle">{s.obStep2Sub}</p>
            {s.obSchools.map((school, i) => (
              <button key={i} className={`ob-school-btn ${form.school === school ? 'selected' : ''}`}
                onClick={() => setForm(f => ({...f, school}))}>
                {school}
              </button>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="ob-title serif">{s.obStep3Title}</h2>
            <p className="ob-subtitle">{s.obStep3Sub}</p>
            <label className="ob-label">{s.obIndustry}</label>
            <input className="ob-input" placeholder={s.obIndustryPh} value={form.industry}
              onChange={e => setForm(f => ({...f, industry: e.target.value}))} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="ob-title serif">{s.obStep4Title}</h2>
            <p className="ob-subtitle" style={{marginBottom:6}}>{s.obStep4Sub}</p>
            <div className="ob-intent-grid">
              {s.obIntents.map((label, i) => (
                <button key={label}
                  className={`ob-intent-btn ${form.intents.includes(label) ? 'selected' : ''}`}
                  style={form.intents.includes(label) ? {borderColor: intentColors[i], background: intentColors[i] + '18'} : {}}
                  onClick={() => toggleIntent(label)}>
                  <span>{intentIcons[i]}</span> {label}
                </button>
              ))}
            </div>
            <label className="ob-label" style={{marginTop:20}}>{s.obQuoteLabel}</label>
            <textarea className="ob-textarea" placeholder={s.obQuotePh}
              value={form.quote} onChange={e => setForm(f => ({...f, quote: e.target.value}))} />
            <p className="ob-hint">{s.obHint}</p>
          </>
        )}
      </div>

      <button className="ob-btn serif" onClick={next}>
        {step < 3 ? s.obNext : s.obFinish}
      </button>
    </div>
  )
}
