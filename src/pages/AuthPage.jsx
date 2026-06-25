import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'
import { auth } from '../firebase'
import { useLang } from '../LangContext'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import './AuthPage.css'

// ── Country / region dialling codes ──────────────────────────────────────────
// Key = ISO 3166-1 alpha-2, displayed in the user's current language.
const COUNTRIES = [
  { code: 'CN', dial: '+86',  zh: '中国大陆',   en: 'China'        },
  { code: 'HK', dial: '+852', zh: '中国香港',   en: 'Hong Kong'    },
  { code: 'TW', dial: '+886', zh: '中国台湾',   en: 'Taiwan'       },
  { code: 'MO', dial: '+853', zh: '中国澳门',   en: 'Macau'        },
  { code: 'US', dial: '+1',   zh: '美国/加拿大', en: 'US / Canada'  },
  { code: 'GB', dial: '+44',  zh: '英国',       en: 'United Kingdom' },
  { code: 'JP', dial: '+81',  zh: '日本',       en: 'Japan'        },
  { code: 'KR', dial: '+82',  zh: '韩国',       en: 'South Korea'  },
  { code: 'SG', dial: '+65',  zh: '新加坡',     en: 'Singapore'    },
  { code: 'AU', dial: '+61',  zh: '澳大利亚',   en: 'Australia'    },
  { code: 'DE', dial: '+49',  zh: '德国',       en: 'Germany'      },
  { code: 'FR', dial: '+33',  zh: '法国',       en: 'France'       },
  { code: 'MY', dial: '+60',  zh: '马来西亚',   en: 'Malaysia'     },
  { code: 'TH', dial: '+66',  zh: '泰国',       en: 'Thailand'     },
  { code: 'IN', dial: '+91',  zh: '印度',       en: 'India'        },
]

async function redirectAfterAuth(uid, navigate) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists() && snap.data().onboardingStatus === 'completed') {
      navigate('/directory', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  } catch {
    navigate('/onboarding', { replace: true })
  }
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [phoneStep, setPhoneStep] = useState('enter-phone') // 'idle' | 'enter-phone' | 'enter-otp'
  const [emailStep, setEmailStep]   = useState('idle')      // 'idle' | 'enter-email'
  const [countryCode, setCountryCode] = useState('CN')
  const [phoneLocal, setPhoneLocal] = useState('')
  const [otp, setOtp]           = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const recaptchaRef  = useRef(null)
  const confirmationRef = useRef(null)
  const countryRef = useRef(null)

  const selectedCountry = useMemo(() => COUNTRIES.find(c => c.code === countryCode), [countryCode])

  // Close the country dropdown when clicking outside it
  useEffect(() => {
    if (!countryOpen) return
    const onDown = e => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [countryOpen])

  // Init invisible reCAPTCHA verifier when phone step opens
  useEffect(() => {
    if (phoneStep !== 'enter-phone') return
    if (recaptchaRef.current) { recaptchaRef.current.clear() }
    try {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'phone-recaptcha', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {},
      })
    } catch (e) { console.error('reCAPTCHA init error:', e) }
    return () => {
      if (recaptchaRef.current) { recaptchaRef.current.clear() }
    }
  }, [phoneStep])

  const t = {
    heading:    lang === 'zh' ? '欢迎加入圈子' : 'Welcome to the Circle',
    sub:        lang === 'zh' ? '请验证你的身份以继续' : 'Verify your identity to continue',
    emailPh:    lang === 'zh' ? '你的邮箱地址' : 'Your email address',
    sendLink:   lang === 'zh' ? '发送魔法链接' : 'Send Magic Link',
    sending:    lang === 'zh' ? '发送中…' : 'Sending…',
    sentTitle:  lang === 'zh' ? '邮件已发送 ✦' : 'Check your inbox ✦',
    sentSub:    lang === 'zh' ? '我们已向以下邮箱发送了一个登录链接。点击链接即可登录，无需密码。' : 'We sent a sign-in link to the address below. Click it to sign in — no password needed.',
    resend:     lang === 'zh' ? '重新发送' : 'Resend',
    orDivider:  lang === 'zh' ? '或' : 'or',
    google:     lang === 'zh' ? '使用 Google 继续' : 'Continue with Google',
    phone:      lang === 'zh' ? '使用手机号继续' : 'Continue with Phone',
    emailBtn:   lang === 'zh' ? '使用邮箱继续' : 'Continue with Email',
    emailBack:  lang === 'zh' ? '← 返回' : '← Back',
    inviteOnly: lang === 'zh' ? '仅限受邀成员' : 'Invite-only members only',
  }

  const errors = {
    'email-required':    lang === 'zh' ? '请输入邮箱' : 'Please enter your email',
    'email-failed':      lang === 'zh' ? '发送失败，请检查邮箱地址。' : 'Failed to send — check the email address.',
    'google-failed':     lang === 'zh' ? 'Google 登录失败，请重试。' : 'Google sign-in failed. Please try again.',
    'phone-required':    lang === 'zh' ? '请输入手机号' : 'Please enter your phone number',
    'phone-no-plus':     lang === 'zh' ? '请选择国家/地区并输入手机号' : 'Choose a country/region and enter your phone number',
    'phone-invalid':     lang === 'zh' ? '手机号格式无效，请检查后重试。' : 'Invalid phone number — please check and try again.',
    'phone-not-enabled': lang === 'zh' ? '手机登录未在后台开启，请联系管理员。' : 'Phone sign-in is not enabled — please contact the admin.',
    'phone-throttled':   lang === 'zh' ? '发送次数过多，请稍后再试。' : 'Too many attempts — please wait a moment and try again.',
    'phone-failed':      lang === 'zh' ? '发送失败，请确认国家/地区与手机号是否匹配。' : 'Failed to send — check that the country/region matches the number.',
    'otp-required':      lang === 'zh' ? '请输入验证码' : 'Please enter the code',
    'otp-invalid':       lang === 'zh' ? '验证码无效，请重试。' : 'Invalid code — please try again.',
  }

  const handleSendLink = async () => {
    if (!email.trim()) { setError('email-required'); return }
    setLoading(true); setError('')
    try {
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings)
      localStorage.setItem('serendipity_email_for_link', email.trim())
      setSent(true)
    } catch {
      setError('email-failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await redirectAfterAuth(result.user.uid, navigate)
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') setError('google-failed')
    }
  }

  auth.languageCode = lang === 'zh' ? 'zh-CN' : 'en'

  const handleSendCode = async () => {
    const localDigits = phoneLocal.trim().replace(/\D/g, '')
    if (!localDigits) { setError('phone-required'); return }
    if (!selectedCountry?.dial) { setError('phone-no-plus'); return }
    const normalised = `${selectedCountry.dial}${localDigits}`
    setLoading(true); setError('')
    try {
      const result = await signInWithPhoneNumber(auth, normalised, recaptchaRef.current)
      confirmationRef.current = result
      setPhoneStep('enter-otp')
    } catch (e) {
      console.error('Phone auth error:', e.code, e.message)
      if (e.code === 'auth/operation-not-allowed')  setError('phone-not-enabled')
      else if (e.code === 'auth/invalid-phone-number') setError('phone-invalid')
      else if (e.code === 'auth/too-many-requests')    setError('phone-throttled')
      else setError('phone-failed')
      if (recaptchaRef.current) { recaptchaRef.current.clear() }
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError('otp-required'); return }
    setLoading(true); setError('')
    try {
      const result = await confirmationRef.current.confirm(otp.trim())
      await redirectAfterAuth(result.user.uid, navigate)
    } catch {
      setError('otp-invalid')
    } finally { setLoading(false) }
  }

  const resetEmail = () => {
    setEmailStep('idle'); setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      {/* Logo */}
      <div className="auth-logo-wrap">
        <div className="auth-icon-border">
          <div className="auth-icon-inner">
            <img src="/logo-star.png" className="auth-icon-img" alt="SerenDipity" />
          </div>
        </div>
        <h1 className="auth-wordmark">
          <span className="auth-wordmark-white">Seren</span><span className="auth-wordmark-gold">Dipity</span>
        </h1>
      </div>

      {/* Card */}
      <div className="auth-card">
        <h2 className="auth-heading">{t.heading}</h2>
        <p className="auth-sub">{t.sub}</p>

        {sent ? (
          <div className="auth-sent">
            <div className="auth-sent-icon">✦</div>
            <p className="auth-sent-title">{t.sentTitle}</p>
            <p className="auth-sent-sub">{t.sentSub}</p>
            <p className="auth-spam-note">{lang === 'zh' ? '如果没有收到，请检查垃圾邮件文件夹。' : "If you don't see it, please check your spam folder."}</p>
            <p className="auth-sent-email">{email}</p>
            <button className="auth-resend" onClick={() => { setSent(false); setEmailStep('enter-email') }}>{t.resend}</button>
          </div>
        ) : (
          <>
            {/* ── Phone sign-in — PRIMARY, expanded by default ── */}
            {phoneStep === 'enter-phone' && (
              <div className="auth-phone-section">
                <div className="auth-phone-row">
                  <div className="auth-phone-select-wrap" ref={countryRef}>
                    <button
                      type="button"
                      className="auth-phone-select"
                      onClick={() => setCountryOpen(o => !o)}
                      aria-label={lang === 'zh' ? '国家/地区' : 'Country / region'}
                      aria-expanded={countryOpen}
                    >
                      <span className="auth-phone-select-code">{selectedCountry?.dial}</span>
                      <svg className={`auth-phone-select-caret ${countryOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {countryOpen && (
                      <ul className="auth-phone-dropdown">
                        {COUNTRIES.map(c => (
                          <li key={c.code}>
                            <button
                              type="button"
                              className={`auth-phone-dropdown-item ${c.code === countryCode ? 'active' : ''}`}
                              onClick={() => { setCountryCode(c.code); setCountryOpen(false); }}
                            >
                              <span className="auth-phone-dropdown-name">{lang === 'zh' ? c.zh : c.en}</span>
                              <span className="auth-phone-dropdown-code">{c.dial}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    className="auth-input auth-phone-local"
                    type="tel"
                    inputMode="numeric"
                    placeholder={selectedCountry?.code === 'CN' ? '138 0000 0000' : 'phone number'}
                    value={phoneLocal}
                    onChange={e => setPhoneLocal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                    autoFocus
                  />
                </div>
                <div id="phone-recaptcha" className="auth-recaptcha" />
                <button className="auth-send-btn" onClick={handleSendCode} disabled={loading}>
                  {loading ? (lang === 'zh' ? '发送中…' : 'Sending…') : (lang === 'zh' ? '发送验证码' : 'Send Code')}
                </button>
              </div>
            )}

            {phoneStep === 'enter-otp' && (
              <div className="auth-phone-section">
                <p className="auth-phone-hint">
                  {lang === 'zh'
                    ? `验证码已发送至 ${selectedCountry?.dial} ${phoneLocal}`
                    : `Code sent to ${selectedCountry?.dial} ${phoneLocal}`}
                </p>
                <div className="auth-email-row">
                  <input
                    className="auth-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={lang === 'zh' ? '6 位验证码' : '6-digit code'}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                    autoFocus
                  />
                  <button className="auth-send-btn" onClick={handleVerifyOtp} disabled={loading}>
                    {loading ? (lang === 'zh' ? '验证中…' : 'Verifying…') : (lang === 'zh' ? '验证' : 'Verify')}
                  </button>
                </div>
                <button className="auth-phone-back" onClick={() => { setPhoneStep('enter-phone'); setOtp(''); setError('') }}>
                  {lang === 'zh' ? '← 重新发送' : '← Resend code'}
                </button>
              </div>
            )}

            {error && <p className="auth-error">{errors[error] ?? error}</p>}

            {/* ── Divider ── */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">{t.orDivider}</span>
              <div className="auth-divider-line" />
            </div>

            {/* ── Google ── */}
            <button className="auth-social-btn" onClick={handleGoogle}>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.google}
            </button>

            {/* ── Email sign-in — collapsed behind a button ── */}
            {emailStep === 'idle' && (
              <button className="auth-social-btn" onClick={() => { setEmailStep('enter-email'); setError('') }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 6l10 7 10-7" />
                </svg>
                {t.emailBtn}
              </button>
            )}

            {emailStep === 'enter-email' && (
              <div className="auth-phone-section">
                <div className="auth-email-row">
                  <input
                    className="auth-input"
                    type="email"
                    placeholder={t.emailPh}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendLink()}
                    autoFocus
                  />
                  <button className="auth-send-btn" onClick={handleSendLink} disabled={loading}>
                    {loading ? t.sending : t.sendLink}
                  </button>
                </div>
                <button className="auth-phone-back" onClick={resetEmail}>
                  {t.emailBack}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="auth-footer">✦ {t.inviteOnly}</p>
    </div>
  )
}
