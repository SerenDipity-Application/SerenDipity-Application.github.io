import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { saveUser } from '../userStorage'
import { startOnboarding, updateOnboardingProgress, saveUserToFirestore } from '../firestoreUsers'
import './OnboardingPage.css'

// ── Step metadata ─────────────────────────────────────────────────────────────
const STEP_LABELS = {
  en: ['Identity', 'School', 'Background', 'Purpose'],
  zh: ['身份',     '学校',   '背景',       '目的'],
}

const STEP_CHAPTERS_EN = ['YOUR WORLD', 'YOUR WORLD', 'YOUR STORY', 'YOUR INTENTIONS']

// ── School options ────────────────────────────────────────────────────────────
const SCHOOLS = {
  en: [
    { id: 'oxford',    label: 'Oxford University',       abbr: 'Ox', color: '#002147' },
    { id: 'cambridge', label: 'University of Cambridge', abbr: 'Ca', color: '#A3112A' },
    { id: 'other',     label: 'Other School',            abbr: '⊕',  color: '#555560' },
  ],
  zh: [
    { id: 'oxford',    label: '牛津大学', abbr: 'Ox', color: '#002147' },
    { id: 'cambridge', label: '剑桥大学', abbr: 'Ca', color: '#A3112A' },
    { id: 'other',     label: '其他学校', abbr: '⊕',  color: '#555560' },
  ],
}

// ── Intent cards ──────────────────────────────────────────────────────────────
const INTENTS = {
  en: [
    { id: 'collab',  icon: '👥', title: 'Find Collaborators',   desc: 'Meet co-founders, co-builders, team members.' },
    { id: 'build',   icon: '🚀', title: 'Build Something',       desc: 'Work on exciting projects and turn ideas into impact.' },
    { id: 'explore', icon: '💼', title: 'Explore Opportunities', desc: 'Discover investment, mentorship and career opportunities.' },
    { id: 'romance', icon: '❤️', title: 'Meet Someone Special',  desc: 'Find meaningful romantic connections.' },
    { id: 'network', icon: '🌐', title: 'Expand My Circle',      desc: 'Make new friends and connect with inspiring people.' },
  ],
  zh: [
    { id: 'collab',  icon: '👥', title: '寻找合伙人',  desc: '认识联创、共建者、团队成员。' },
    { id: 'build',   icon: '🚀', title: '共同创造',     desc: '参与有趣的项目，将想法变为现实。' },
    { id: 'explore', icon: '💼', title: '探索机会',     desc: '发现投资、导师资源和职业机会。' },
    { id: 'romance', icon: '❤️', title: '遇见特别的人', desc: '寻找有意义的情感连接。' },
    { id: 'network', icon: '🌐', title: '扩大人脉圈',   desc: '结交新朋友，与志同道合的人互动。' },
  ],
}

import { MBTI_TYPES, MBTI_MAP, mbtiDisplay } from '../mbti'

// ── Custom MBTI dropdown ──────────────────────────────────────────────────────
function MbtiDropdown({ value, onChange, lang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = value ? MBTI_MAP[value] : null

  return (
    <div className="ob-mbti-dropdown" ref={ref}>
      <button
        className={`ob-mbti-trigger ${open ? 'ob-mbti-trigger-open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {selected
          ? <span className="ob-mbti-selected">{mbtiDisplay(value, lang)}</span>
          : <span className="ob-mbti-placeholder">
              {lang === 'zh' ? '选择你的人格类型 …' : 'Select your personality type …'}
            </span>
        }
        <span className={`ob-mbti-arrow ${open ? 'ob-mbti-arrow-up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="ob-mbti-menu">
          {MBTI_TYPES.map(t => {
            const display = lang === 'zh' ? `${t.code} ${t.zhName} — ${t.descZh}` : `${t.code} ${t.enName} — ${t.descEn}`
            const isActive = value === t.code
            return (
              <button
                key={t.code}
                className={`ob-mbti-option ${isActive ? 'ob-mbti-option-active' : ''}`}
                onClick={() => { onChange(t.code); setOpen(false) }}
              >
                <span className="ob-mbti-option-code">{t.code}</span>
                <span className="ob-mbti-option-name">
                  {lang === 'zh' ? t.zhName : t.enName}
                </span>
                <span className="ob-mbti-option-desc">
                  {lang === 'zh' ? t.descZh : t.descEn}
                </span>
                {isActive && <span className="ob-mbti-option-check">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Year picker dropdown ──────────────────────────────────────────────────────
function YearPicker({ value, onChange, placeholder, lang, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear - 30; y <= currentYear + 4; y++) years.push(y)

  return (
    <div className="ob-mbti-dropdown" ref={ref}>
      <button
        className={`ob-mbti-trigger ${open ? 'ob-mbti-trigger-open' : ''} ${error ? 'ob-field-error' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {value
          ? <span className="ob-mbti-selected">{value}</span>
          : <span className="ob-mbti-placeholder">{placeholder}</span>
        }
        <span className={`ob-mbti-arrow ${open ? 'ob-mbti-arrow-up' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="ob-mbti-menu ob-year-menu">
          {years.map(y => (
            <button
              key={y}
              className={`ob-mbti-option ${value === y ? 'ob-mbti-option-active' : ''}`}
              onClick={() => { onChange(y); setOpen(false) }}
            >
              <span className="ob-year-option">{y}</span>
              {value === y && <span className="ob-mbti-option-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ placeholder, value, onChange, error, type = 'text', multiline }) {
  if (multiline) {
    return (
      <textarea
        className={`ob-field ob-field-area ${error ? 'ob-field-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
      />
    )
  }
  return (
    <input
      className={`ob-field ${error ? 'ob-field-error' : ''}`}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    name: '', enName: '', city: '',
    school: '', customSchool: '', major: '',
    enrollmentYear: '', graduationYear: '',
    industry: '', credentials: '', company: '', position: '', quote: '',
    intents: [], signals: '', mbti: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setAnswers(a => ({ ...a, [k]: v }))
  const toggleIntent = (id) => set('intents',
    answers.intents.includes(id)
      ? answers.intents.filter(i => i !== id)
      : [...answers.intents, id]
  )

  // Restore draft on mount, then start/update Firestore record
  useEffect(() => {
    try {
      const draft = localStorage.getItem('serendipity_ob_draft')
      if (draft) {
        const { step: s, answers: a } = JSON.parse(draft)
        if (typeof s === 'number') setStep(s)
        if (a) setAnswers(prev => ({ ...prev, ...a }))
      }
    } catch (_) {}
    startOnboarding().catch(() => {})
  }, [])

  const labels = STEP_LABELS[lang]
  const schools = SCHOOLS[lang]
  const intents = INTENTS[lang]
  const isLast = step === 3

  // ── Validation ──
  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!answers.name.trim()) e.name = true
      if (!answers.city.trim()) e.city = true
    }
    if (step === 1) {
      if (!answers.school) e.school = true
      if (answers.school === 'other' && !answers.customSchool.trim()) e.customSchool = true
      if (!answers.major.trim()) e.major = true
      if (!answers.enrollmentYear) e.enrollmentYear = true
      if (!answers.graduationYear) e.graduationYear = true
    }
    if (step === 2) {
      if (!answers.industry.trim()) e.industry = true
      if (!answers.company.trim()) e.company = true
      if (!answers.position.trim()) e.position = true
    }
    if (step === 3) {
      if (answers.intents.length === 0) e.intents = true
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Next / submit ──
  const handleNext = async () => {
    if (!validate()) return

    const institution = answers.school === 'other'
      ? answers.customSchool
      : schools.find(s => s.id === answers.school)?.label || ''

    const profile = {
      zhName:       answers.name,
      enName:       answers.enName || answers.name,
      city:         answers.city,
      school:       institution,
      major:        answers.major,
      enrollmentYear: answers.enrollmentYear || null,
      graduationYear: answers.graduationYear || null,
      industry:     answers.industry,
      company:      answers.company,
      position:     answers.position,
      credentials:  answers.credentials,
      quote:        answers.quote,
      intents:      answers.intents.map(id => intents.find(i => i.id === id)?.title || id),
      hiddenSignals: answers.signals,
      mbti:         answers.mbti,
    }

    if (isLast) {
      saveUser(profile)
      localStorage.removeItem('serendipity_ob_draft')
      await saveUserToFirestore(profile).catch(() => {})
      navigate('/directory')
      return
    }

    const nextStep = step + 1
    // Persist draft so user can resume if they close the browser mid-form
    try {
      localStorage.setItem('serendipity_ob_draft', JSON.stringify({ step: nextStep, answers }))
    } catch (_) {}

    await updateOnboardingProgress(profile, {
      currentQ:          nextStep + 1,
      currentChapter:    STEP_CHAPTERS_EN[nextStep],
      questionsAnswered: step + 1,
      totalQuestions:    4,
      completed:         false,
    }).catch(() => {})

    setErrors({})
    setStep(nextStep)
  }

  const handleBack = () => {
    setErrors({})
    setStep(s => s - 1)
  }

  return (
    <div className="ob-page">

      {/* ── Top bar ── */}
      <div className="ob-topbar">
        {step > 0
          ? <button className="ob-back" onClick={handleBack}>‹</button>
          : <div className="ob-back-placeholder" />
        }
        <span className="ob-step-count">
          {lang === 'zh' ? `第 ${step + 1} / 4 步` : `Step ${step + 1} of 4`}
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Progress dots ── */}
      <div className="ob-progress">
        {labels.map((label, i) => (
          <div key={i} className="ob-progress-item">
            <div className="ob-progress-track-row">
              {i > 0 && <div className={`ob-line ${i <= step ? 'ob-line-done' : ''}`} />}
              <div className={`ob-dot ${i < step ? 'ob-dot-done' : i === step ? 'ob-dot-current' : ''}`} />
              {i < labels.length - 1 && <div className={`ob-line ${i < step ? 'ob-line-done' : ''}`} />}
            </div>
            <span className={`ob-dot-label ${i === step ? 'ob-dot-label-active' : ''}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Scrollable content ── */}
      <div className="ob-content">

        {/* Heading */}
        <h1 className="ob-title">
          {step === 0 && (lang === 'zh'
            ? <><br />让我们从<br />你的<span className="ob-accent">基础</span>开始。</>
            : <>Let's start with<br />the <span className="ob-accent">basics.</span></>)}
          {step === 1 && (lang === 'zh'
            ? <>你在哪里<br /><span className="ob-accent">求学</span>？</>
            : <>Where did<br />you <span className="ob-accent">study?</span></>)}
          {step === 2 && (lang === 'zh'
            ? <>分享你的<br /><span className="ob-accent">故事</span>。</>
            : <>Tell us<br />your <span className="ob-accent">story.</span></>)}
          {step === 3 && (lang === 'zh'
            ? <>什么<span className="ob-accent">带你</span><br />来到这里？</>
            : <>What <span className="ob-accent">brings</span><br />you here?</>)}
        </h1>

        <p className="ob-subtitle">
          {step === 0 && (lang === 'zh' ? '让我们更好地了解你。' : 'So we can get to know you better.')}
          {step === 1 && (lang === 'zh' ? '请选择你的学校。' : 'Select your school.')}
          {step === 2 && (lang === 'zh' ? '让圈子了解你带来了什么。' : 'Help the circle understand what you bring.')}
          {step === 3 && (lang === 'zh' ? '可以选择多个。' : 'You can choose more than one.')}
        </p>

        {/* ── Step 0: Identity ── */}
        {step === 0 && (
          <div className="ob-fields">
            <Field
              placeholder={lang === 'zh' ? '你叫什么名字？' : 'Full name — what should we call you?'}
              value={answers.name}
              onChange={v => set('name', v)}
              error={errors.name}
            />
            <Field
              placeholder={lang === 'zh' ? '英文名（可选）' : 'English name (optional)'}
              value={answers.enName}
              onChange={v => set('enName', v)}
            />
            <Field
              placeholder={lang === 'zh' ? '你现在在哪座城市？' : 'Current city — where are you based?'}
              value={answers.city}
              onChange={v => set('city', v)}
              error={errors.city}
            />

            {/* ── MBTI ── */}
            <div className="ob-mbti-section">
              <p className="ob-mbti-heading">
                {lang === 'zh' ? '人格类型（可选）' : 'Personality type (optional)'}
              </p>
              <MbtiDropdown
                value={answers.mbti}
                onChange={v => set('mbti', v)}
                lang={lang}
              />
            </div>
          </div>
        )}

        {/* ── Step 1: School ── */}
        {step === 1 && (
          <div className="ob-fields">
            {schools.map(s => (
              <button
                key={s.id}
                className={`ob-school-card ${answers.school === s.id ? 'ob-school-selected' : ''} ${errors.school && !answers.school ? 'ob-school-error' : ''}`}
                onClick={() => set('school', s.id)}
              >
                <span className="ob-school-icon" style={{ background: s.color }}>{s.abbr}</span>
                <span className="ob-school-label">{s.label}</span>
                {answers.school === s.id && <span className="ob-school-check">✓</span>}
              </button>
            ))}
            {answers.school === 'other' && (
              <Field
                placeholder={lang === 'zh' ? '请填写学校名称，例如：帝国理工学院' : 'e.g. Imperial College London'}
                value={answers.customSchool}
                onChange={v => set('customSchool', v)}
                error={errors.customSchool}
              />
            )}

            {/* Education details — shown after a school is selected */}
            {(answers.school) && (
              <>
                <Field
                  placeholder={lang === 'zh' ? '你的专业是什么？' : 'What is your major?'}
                  value={answers.major}
                  onChange={v => set('major', v)}
                  error={errors.major}
                />
                <div className="ob-year-row">
                  <YearPicker
                    value={answers.enrollmentYear}
                    onChange={v => set('enrollmentYear', v)}
                    placeholder={lang === 'zh' ? '入学年份' : 'Start year'}
                    lang={lang}
                    error={errors.enrollmentYear}
                  />
                  <YearPicker
                    value={answers.graduationYear}
                    onChange={v => set('graduationYear', v)}
                    placeholder={lang === 'zh' ? '毕业年份' : 'Grad year'}
                    lang={lang}
                    error={errors.graduationYear}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Background ── */}
        {step === 2 && (
          <div className="ob-fields">
            <Field
              placeholder={lang === 'zh' ? '你目前在做什么？行业' : 'What industry are you in?'}
              value={answers.industry}
              onChange={v => set('industry', v)}
              error={errors.industry}
            />
            <Field
              placeholder={lang === 'zh' ? '公司（仅用于匹配，不会公开显示）' : 'Company (for matching only, not shown publicly)'}
              value={answers.company}
              onChange={v => set('company', v)}
              error={errors.company}
            />
            <Field
              placeholder={lang === 'zh' ? '职位（仅用于匹配，不会公开显示）' : 'Position (for matching only, not shown publicly)'}
              value={answers.position}
              onChange={v => set('position', v)}
              error={errors.position}
            />
            <Field
              placeholder={lang === 'zh' ? '用一句话描述你自己，或分享你正在思考的事…' : 'Something that makes you you — a thought, project, or obsession…'}
              value={answers.quote}
              onChange={v => set('quote', v)}
              multiline
            />
          </div>
        )}

        {/* ── Step 3: Purpose ── */}
        {step === 3 && (
          <div className="ob-fields">
            <div className={`ob-intents-grid ${errors.intents ? 'ob-intents-error' : ''}`}>
              {intents.map(intent => (
                <button
                  key={intent.id}
                  className={`ob-intent-card ${answers.intents.includes(intent.id) ? 'ob-intent-selected' : ''}`}
                  onClick={() => toggleIntent(intent.id)}
                >
                  <span className="ob-intent-icon">{intent.icon}</span>
                  <span className="ob-intent-title">{intent.title}</span>
                  <span className="ob-intent-desc">{intent.desc}</span>
                </button>
              ))}
            </div>

            <Field
              placeholder={lang === 'zh'
                ? '还有什么想告诉圈子的吗？（仅限你可见，可选）'
                : 'Anything you\'d prefer to keep private? Only you can see this. (optional)'}
              value={answers.signals}
              onChange={v => set('signals', v)}
              multiline
            />
          </div>
        )}

        {/* Error hint */}
        {Object.keys(errors).length > 0 && (
          <p className="ob-error-hint">
            {lang === 'zh' ? '请填写必填项后继续。' : 'Please fill in the required fields to continue.'}
          </p>
        )}

      </div>

      {/* ── Footer button ── */}
      <div className="ob-footer">
        <button className="ob-btn" onClick={handleNext}>
          {isLast
            ? (lang === 'zh' ? '完成并进入 →' : 'Complete & Enter →')
            : (lang === 'zh' ? '下一步 →' : 'Next Step →')}
        </button>
      </div>

    </div>
  )
}
