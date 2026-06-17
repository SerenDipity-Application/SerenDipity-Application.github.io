import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
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

const MEMBER_CACHE_KEY = id => `serendipity_member_${id}`

export default function IcebreakerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, s } = useLang()

  // Prefer state (normal flow), then sessionStorage (page reload), then static data
  const stateMember = location.state?.member
  if (stateMember) sessionStorage.setItem(MEMBER_CACHE_KEY(id), JSON.stringify(stateMember))
  const member = stateMember
    || (() => { try { return JSON.parse(sessionStorage.getItem(MEMBER_CACHE_KEY(id))) } catch { return null } })()
    || members.find(m => String(m.id) === id || String(m.uid) === id)
    || members[0]

  const [activeTone, setActiveTone] = useState('recommended')
  const [mode, setMode] = useState('ai')          // 'ai' | 'custom'
  const [customText, setCustomText] = useState('')
  const [copied, setCopied] = useState(false)

  const messages = lang === 'zh' ? messagesZH : messagesEN
  const toneKeys = ['direct', 'casual']

  const activeText = mode === 'custom' ? customText : messages[activeTone](member)

  const copy = () => {
    navigator.clipboard.writeText(activeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // When switching to custom mode, pre-fill with current AI suggestion
  const switchToCustom = () => {
    if (!customText) setCustomText(messages[activeTone](member))
    setMode('custom')
  }

  // When switching back to AI mode, keep custom text in state for re-editing
  const switchToAI = () => setMode('ai')

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

      {/* Mode tabs */}
      <div className="ib-mode-tabs">
        <button
          className={`ib-mode-tab ${mode === 'ai' ? 'active' : ''}`}
          onClick={switchToAI}>
          ✦ {lang === 'zh' ? 'AI 建议' : 'AI Suggestions'}
        </button>
        <button
          className={`ib-mode-tab ${mode === 'custom' ? 'active' : ''}`}
          onClick={switchToCustom}>
          {s.ibWriteOwn}
        </button>
      </div>

      <div className="ib-card">
        {mode === 'ai' ? (
          <>
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

            {/* Recommended message box */}
            <div className={`ib-message-box ${activeTone === 'recommended' ? 'gold' : ''}`}>
              {activeTone === 'recommended' && (
                <div className="ib-rec-label">✦ {lang === 'zh' ? '推荐' : 'Recommended'}</div>
              )}
              <p className="ib-message">{messages[activeTone](member)}</p>
              {activeTone === 'recommended' && <div className="ib-check">✓</div>}
            </div>

            {/* Tone options */}
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

            {/* Use AI text as starting point for custom */}
            <button className="ib-use-as-base" onClick={switchToCustom}>
              {lang === 'zh' ? '✏ 在此基础上自己改' : '✏ Edit this as a starting point'}
            </button>
          </>
        ) : (
          <>
            <div className="ib-card-header">
              <span className="ib-star">✏</span>
              <h2 className="ib-card-title serif">{s.ibWriteOwnTitle}</h2>
            </div>
            <p className="ib-to">
              {lang === 'zh'
                ? <>发给 <b>{member.zhName}</b></>
                : <>To <b>{member.enName}</b></>
              }
            </p>

            <textarea
              className="ib-custom-textarea"
              placeholder={s.ibWriteOwnPh}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              autoFocus
            />

            <p className="ib-custom-hint">{s.ibWriteOwnHint}</p>

            {/* Quick-fill chips */}
            <p className="ib-tone-label">
              {lang === 'zh' ? '或者用 AI 建议填入：' : 'Or fill in from an AI suggestion:'}
            </p>
            <div className="ib-tones">
              {['recommended', ...toneKeys].map((key, i) => (
                <button key={key}
                  className="ib-tone-btn ib-fill-btn"
                  onClick={() => setCustomText(messages[key](member))}>
                  <span className="ib-tone-title">
                    {key === 'recommended'
                      ? (lang === 'zh' ? '✦ 推荐版本' : '✦ Recommended')
                      : s.ibTones[i - 1]}
                  </span>
                  <p className="ib-tone-preview">{messages[key](member).slice(0, 36)}…</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="ib-actions">
        <button className="ib-copy-btn" onClick={copy} disabled={mode === 'custom' && !customText.trim()}>
          {copied ? s.ibCopied : s.ibCopy}
        </button>
        <button className="ib-send-btn serif"
          onClick={() => navigate(`/dm/${member.uid || member.id}`, { state: { member, firstMessage: activeText } })}
          disabled={mode === 'custom' && !customText.trim()}>
          {s.ibSend}
        </button>
      </div>

      <p className="ib-disclaimer">{s.ibDisclaimer}</p>
    </div>
  )
}
