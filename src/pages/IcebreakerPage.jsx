import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLang } from '../LangContext'
import { members } from '../data'
import { sendDmRequest } from '../firestoreNotifications'
import { loadUserFromFirestore } from '../firestoreUsers'
import './IcebreakerPage.css'

const MEMBER_CACHE_KEY = id => `serendipity_member_${id}`

// ── Smart pair-aware icebreaker generator ────────────────────────────────────
// Compares both profiles and only references things that are actually true
// for this specific pair — never assumes shared school, industry, etc.
function buildMessages(me, them, lang) {
  const zh = lang === 'zh'

  const theirName    = zh ? (them?.zhName || them?.enName) : (them?.enName || them?.zhName)
  const theirSchool  = zh ? (them?.school || them?.schoolEn) : (them?.schoolEn || them?.school)
  const theirField   = zh ? them?.industry : (them?.industryEn || them?.industry)
  const theirQuote   = zh ? (them?.quote   || them?.quoteEn)  : (them?.quoteEn  || them?.quote)
  const theirIntents = them?.intents || []

  const mySchool     = me ? (zh ? (me?.school || me?.schoolEn) : (me?.schoolEn || me?.school)) : null
  const myField      = me ? (zh ? me?.industry : (me?.industryEn || me?.industry)) : null
  const myIntents    = me?.intents || []

  // What do they actually share?
  const sameSchool   = !!(mySchool && theirSchool &&
    mySchool.toLowerCase().split(/[\s,]/)[0] === theirSchool.toLowerCase().split(/[\s,]/)[0])
  const sameField    = !!(myField && theirField &&
    myField.toLowerCase() === theirField.toLowerCase())
  const sharedIntents = theirIntents.filter(i => myIntents.includes(i))

  // ── Recommended: strongest true connection ────────────────────────────────
  let recommended
  if (zh) {
    if (sameSchool && sharedIntents.length > 0) {
      recommended = `${theirName}你好！看到我们都来自${theirSchool}，又都在寻找「${sharedIntents[0]}」，感觉太有缘了，一定要来打个招呼！`
    } else if (sameSchool) {
      recommended = `${theirName}你好！看到你也是${theirSchool}的校友，在这里相遇很开心，很想认识你！`
    } else if (sharedIntents.length >= 2) {
      recommended = `${theirName}你好！注意到我们都在寻找「${sharedIntents[0]}」和「${sharedIntents[1]}」，感觉目标很契合，很想和你深聊！`
    } else if (sharedIntents.length === 1) {
      recommended = `${theirName}你好！看到你也在寻找「${sharedIntents[0]}」——这正是我来这里最想做的事，很想和你聊聊你的想法！`
    } else if (theirQuote) {
      recommended = `${theirName}你好！你写的「${theirQuote}」让我很有共鸣，很想认识你、聊聊背后的故事。`
    } else if (theirField) {
      recommended = `${theirName}你好！看到你在${theirField}领域深耕，很想了解更多你的经历和想法，有机会聊聊吗？`
    } else {
      recommended = `${theirName}你好！在 SerenDipity 看到你的档案，感觉很有意思，很想认识你！`
    }
  } else {
    if (sameSchool && sharedIntents.length > 0) {
      recommended = `Hi ${theirName}! We're both from ${theirSchool} and both here to ${sharedIntents[0]} — felt like too much of a coincidence not to reach out!`
    } else if (sameSchool) {
      recommended = `Hi ${theirName}! Great to find another ${theirSchool} alum here — would love to connect and hear what you're working on!`
    } else if (sharedIntents.length >= 2) {
      recommended = `Hi ${theirName}! I noticed we're both here to ${sharedIntents[0]} and ${sharedIntents[1]} — seems like we'd have a lot to talk about. Would love to connect!`
    } else if (sharedIntents.length === 1) {
      recommended = `Hi ${theirName}! I saw you're also here to ${sharedIntents[0]} — that's exactly what brought me here too. Would love to compare notes!`
    } else if (theirQuote) {
      recommended = `Hi ${theirName}! "${theirQuote}" — that really resonated with me. Would love to hear the story behind it.`
    } else if (theirField) {
      recommended = `Hi ${theirName}! Your background in ${theirField} caught my eye — would love to hear more about what you're working on.`
    } else {
      recommended = `Hi ${theirName}! Your profile caught my eye on SerenDipity — would love to connect and see where the conversation goes!`
    }
  }

  // ── Direct: professional / field-specific ────────────────────────────────
  let direct
  if (zh) {
    if (sameField) {
      direct = `${theirName}，我们都在${theirField}领域，看到你的背景很有共鸣，想深入交流一下你对这个行业的看法。`
    } else if (theirField) {
      direct = `${theirName}，冒昧打个招呼——我对${theirField}方向一直很感兴趣，看到你的经历很想请教一下。`
    } else if (sharedIntents.length > 0) {
      direct = `${theirName}，看到我们都有意「${sharedIntents[0]}」，想直接问一句：你现在最想推进什么？`
    } else {
      direct = `${theirName}，冒昧打个招呼，直接问一句：你目前在做什么最让你兴奋的事情？`
    }
  } else {
    if (sameField) {
      direct = `Hi ${theirName}, we're both in ${theirField} — would love to compare perspectives and hear what you're focused on right now.`
    } else if (theirField) {
      direct = `Hi ${theirName}, hope you don't mind me reaching out — I've been really drawn to the ${theirField} space and would love to pick your brain.`
    } else if (sharedIntents.length > 0) {
      direct = `Hi ${theirName}, I see we're both here to ${sharedIntents[0]} — what's the most exciting thing you're working on right now?`
    } else {
      direct = `Hi ${theirName}, cutting straight to it — what's the project or idea you're most excited about at the moment?`
    }
  }

  // ── Casual: light, event-based ────────────────────────────────────────────
  let casual
  if (zh) {
    if (theirSchool && mySchool && !sameSchool) {
      casual = `嗨 ${theirName}，${theirSchool}和我们这边碰上了！今天没来得及聊，补个招呼，下周有空喝杯咖啡吗？`
    } else {
      casual = `嗨 ${theirName}，今天现场人太多没聊上，补一个招呼！你的想法我记下了，下周想约杯咖啡？`
    }
  } else {
    if (theirSchool && mySchool && !sameSchool) {
      casual = `Hey ${theirName}, a ${theirSchool} person — nice! Didn't get a chance to say hi properly at the event. Would love to grab coffee next week?`
    } else {
      casual = `Hey ${theirName}, didn't get a chance to say hi at the event — better late than never! Would love to grab coffee next week.`
    }
  }

  return { recommended, direct, casual }
}

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

  const [myProfile, setMyProfile] = useState(null)
  const [activeTone, setActiveTone] = useState('recommended')
  const [mode, setMode] = useState('ai')          // 'ai' | 'custom'
  const [customText, setCustomText] = useState('')
  const [copied, setCopied] = useState(false)

  // Load own profile so we can compare the two people
  useEffect(() => {
    loadUserFromFirestore().then(p => setMyProfile(p)).catch(() => {})
  }, [])

  const messages = buildMessages(myProfile, member, lang)
  const toneKeys = ['direct', 'casual']

  const activeText = mode === 'custom' ? customText : messages[activeTone]

  const copy = () => {
    navigator.clipboard.writeText(activeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const switchToCustom = () => {
    if (!customText) setCustomText(messages[activeTone])
    setMode('custom')
  }
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
              <p className="ib-message">{messages[activeTone]}</p>
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
                  <p className="ib-tone-preview">{messages[key].slice(0, 36)}…</p>
                </button>
              ))}
            </div>

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

            <p className="ib-tone-label">
              {lang === 'zh' ? '或者用 AI 建议填入：' : 'Or fill in from an AI suggestion:'}
            </p>
            <div className="ib-tones">
              {['recommended', ...toneKeys].map((key, i) => (
                <button key={key}
                  className="ib-tone-btn ib-fill-btn"
                  onClick={() => setCustomText(messages[key])}>
                  <span className="ib-tone-title">
                    {key === 'recommended'
                      ? (lang === 'zh' ? '✦ 推荐版本' : '✦ Recommended')
                      : s.ibTones[i - 1]}
                  </span>
                  <p className="ib-tone-preview">{messages[key].slice(0, 36)}…</p>
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
          onClick={async () => {
            if (member.uid) {
              try {
                const profile = await loadUserFromFirestore()
                await sendDmRequest({ toUid: member.uid, message: activeText, senderProfile: profile })
              } catch (e) { console.warn('Could not send notification:', e) }
            }
            navigate(`/dm/${member.uid || member.id}`, { state: { member, firstMessage: activeText } })
          }}
          disabled={mode === 'custom' && !customText.trim()}>
          {s.ibSend}
        </button>
      </div>

      <p className="ib-disclaimer">{s.ibDisclaimer}</p>
    </div>
  )
}
