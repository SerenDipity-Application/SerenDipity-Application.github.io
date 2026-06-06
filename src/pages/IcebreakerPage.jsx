import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import './IcebreakerPage.css'

const messagesZH = {
  recommended: (m) => `${m.zhName}你好！同是牛津的，刚在名录里看到你也在找合作——「${m.quote}」很想和你聊聊。`,
  direct:      (m) => `${m.zhName}，冒昧打个招呼——我对你做的「${m.industry}」方向一直很有兴趣，想请教一下。`,
  casual:      (m) => `嗨${m.zhName}，今天现场人太多没聊上聊，补一个招呼！你的诉求我记下了，下周想约杯咖啡。`,
}
const messagesEN = {
  recommended: (m) => `Hi ${m.enName}! Fellow Oxonian here — I just spotted your profile in the directory and saw you're also open to collaborating. Would love to have a chat!`,
  direct:      (m) => `Hi ${m.enName}, hope you don't mind me reaching out — I've been really interested in the ${m.industry} space and would love to pick your brain.`,
  casual:      (m) => `Hey ${m.enName}, didn't get a chance to say hi at the event — better late than never! Noted your intentions, would love to grab coffee next week.`,
}

export default function IcebreakerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, s } = useLang()
  const member = members.find(m => m.id === parseInt(id)) || members[0]
  const [activeTone, setActiveTone] = useState('recommended')
  const [copied, setCopied] = useState(false)

  const messages = lang === 'zh' ? messagesZH : messagesEN

  const copy = () => {
    navigator.clipboard.writeText(messages[activeTone](member))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toneKeys = ['direct', 'casual']

  return (
    <div className="ib-page">
      <div className="ib-header">
        <button className="ib-back" onClick={() => navigate(-1)}>{s.back}</button>
        <span className="ib-header-label serif">SerenDipity</span>
        <span className="ib-online">{s.online}</span>
      </div>

      <div className="ib-hero-text">
        <p className="ib-small-label">{s.ibSmallLabel}</p>
      </div>

      <div className="ib-card">
        <div className="ib-card-header">
          <span className="ib-star">✦</span>
          <h2 className="ib-card-title serif">{s.ibTitle}</h2>
        </div>
        <p className="ib-to">
          {lang === 'zh'
            ? <>发给 <b>{member.zhName}</b> · 都是见过面的人，主动一点不会唐突。</>
            : <>To <b>{member.enName}</b> · You've met in person — reaching out is natural.</>
          }
        </p>

        <div className={`ib-message-box ${activeTone === 'recommended' ? 'gold' : ''}`}>
          {activeTone === 'recommended' && <div className="ib-rec-label">✦ {lang === 'zh' ? '推荐' : 'Recommended'}</div>}
          <p className="ib-message">{messages[activeTone](member)}</p>
          {activeTone === 'recommended' && <div className="ib-check">✓</div>}
        </div>

        <p className="ib-tone-label">{s.ibToneLabel}</p>
        <div className="ib-tones">
          {toneKeys.map((key, i) => (
            <button key={key}
              className={`ib-tone-btn ${activeTone === key ? 'active' : ''}`}
              onClick={() => setActiveTone(key)}>
              <span className="ib-tone-title">{s.ibTones[i]}</span>
              <p className="ib-tone-preview">{messages[key](member).slice(0, 36)}…</p>
            </button>
          ))}
        </div>
      </div>

      <div className="ib-actions">
        <button className="ib-copy-btn" onClick={copy}>{copied ? s.ibCopied : s.ibCopy}</button>
        <button className="ib-send-btn serif" onClick={() => navigate('/chat')}>{s.ibSend}</button>
      </div>

      <p className="ib-disclaimer">{s.ibDisclaimer}</p>
    </div>
  )
}
