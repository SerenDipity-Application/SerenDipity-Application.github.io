import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './OnboardingPage.css'

const steps = ['身份', '院校', '背景', '诉求']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    zhName: '', enName: '', school: '', industry: '', city: '',
    intents: [], quote: ''
  })

  const intentOptions = [
    { label: '结识朋友', icon: '👥', color: '#6B8CAE' },
    { label: '寻找合作', icon: '🤝', color: '#3D7A6B' },
    { label: '商务对接', icon: '💼', color: '#B5713A' },
    { label: '寻觅伴侣', icon: '♡', color: '#C4857A' },
  ]

  const toggleIntent = (label) => {
    setForm(f => ({
      ...f,
      intents: f.intents.includes(label)
        ? f.intents.filter(i => i !== label)
        : [...f.intents, label]
    }))
  }

  const next = () => step < 3 ? setStep(s => s + 1) : navigate('/directory')

  return (
    <div className="ob-page">
      <div className="ob-header">
        <div className="ob-logo serif">SerenDipity</div>
        <span className="ob-sparkle">✦</span>
      </div>

      <div className="ob-progress-wrap">
        <button className="ob-back" onClick={() => step > 0 ? setStep(s => s-1) : navigate('/intro')}>‹</button>
        <span className="ob-step-label serif">Step {step + 1} / 4</span>
        <div style={{width:24}}/>
      </div>

      <div className="ob-track">
        {steps.map((s, i) => (
          <div key={s} className={`ob-track-step ${i <= step ? 'done' : ''}`}>
            <div className="ob-dot" />
            <span>{s}</span>
          </div>
        ))}
        <div className="ob-track-line">
          <div className="ob-track-fill" style={{width: `${(step / 3) * 100}%`}} />
        </div>
      </div>

      <div className="ob-content">
        {step === 0 && (
          <>
            <h2 className="ob-title serif">你是谁？</h2>
            <p className="ob-subtitle">让大家认识你</p>
            <label className="ob-label">中文名</label>
            <input className="ob-input" placeholder="例：张嘉嘉" value={form.zhName}
              onChange={e => setForm(f => ({...f, zhName: e.target.value}))} />
            <label className="ob-label">英文名 / 昵称</label>
            <input className="ob-input" placeholder="例：Serena Zhang" value={form.enName}
              onChange={e => setForm(f => ({...f, enName: e.target.value}))} />
            <label className="ob-label">目前所在城市</label>
            <input className="ob-input" placeholder="例：上海" value={form.city}
              onChange={e => setForm(f => ({...f, city: e.target.value}))} />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="ob-title serif">你在哪里求学？</h2>
            <p className="ob-subtitle">选择你的学校</p>
            {['Oxford', 'Cambridge', 'Other'].map(s => (
              <button key={s} className={`ob-school-btn ${form.school === s ? 'selected' : ''}`}
                onClick={() => setForm(f => ({...f, school: s}))}>
                {s === 'Oxford' ? '牛津 · Oxford' : s === 'Cambridge' ? '剑桥 · Cambridge' : '其他 · Other'}
              </button>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="ob-title serif">你的背景</h2>
            <p className="ob-subtitle">介绍你的职业与行业</p>
            <label className="ob-label">行业 / 身份</label>
            <input className="ob-input" placeholder="例：风险投资 · 合伙人" value={form.industry}
              onChange={e => setForm(f => ({...f, industry: e.target.value}))} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="ob-title serif">你此刻想要什么</h2>
            <p className="ob-subtitle" style={{marginBottom:6}}>这是平台的灵魂 —— 把诉求摊开说清楚，连接就没有负担。</p>
            <div className="ob-intent-grid">
              {intentOptions.map(opt => (
                <button key={opt.label}
                  className={`ob-intent-btn ${form.intents.includes(opt.label) ? 'selected' : ''}`}
                  style={form.intents.includes(opt.label) ? {borderColor: opt.color, background: opt.color + '18'} : {}}
                  onClick={() => toggleIntent(opt.label)}>
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            <label className="ob-label" style={{marginTop:20}}>用一句话说说你的具体诉求</label>
            <textarea className="ob-textarea" placeholder="e.g. 我在为公司寻找一位 CTO。"
              value={form.quote} onChange={e => setForm(f => ({...f, quote: e.target.value}))} />
            <p className="ob-hint">✦ 越具体，SerenDipity AI 越能帮你找到对的人。</p>
          </>
        )}
      </div>

      <button className="ob-btn serif" onClick={next}>
        {step < 3 ? '下一步' : '完成，进入名录 →'}
      </button>
    </div>
  )
}
