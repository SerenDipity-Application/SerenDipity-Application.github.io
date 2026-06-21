import { useState, useRef } from 'react'
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
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneStep, setPhoneStep] = useState('idle') // 'idle' | 'enter-phone' | 'enter-otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const recaptchaRef = useRef(null)
  const confirmationRef = useRef(null)

  const t = {
    heading:     lang === 'zh' ? '欢迎加入圈子' : 'Welcome to the Circle',
    sub:         lang === 'zh' ? '请验证你的身份以继续' : 'Verify your identity to continue',
    emailPh:     lang === 'zh' ? '你的邮箱地址' : 'Your email address',
    sendLink:    lang === 'zh' ? '发送魔法链接' : 'Send Magic Link',
    sending:     lang === 'zh' ? '发送中…' : 'Sending…',
    sentTitle:   lang === 'zh' ? '邮件已发送 ✦' : 'Check your inbox ✦',
    sentSub:     lang === 'zh' ? '我们已向以下邮箱发送了一个登录链接。点击链接即可登录，无需密码。' : 'We sent a sign-in link to the address below. Click it to sign in — no password needed.',
    resend:      lang === 'zh' ? '重新发送' : 'Resend',
    orDivider:   lang === 'zh' ? '或' : 'or',
    google:      lang === 'zh' ? '使用 Google 继续' : 'Continue with Google',
    phone:       lang === 'zh' ? '使用手机号继续' : 'Continue with Phone',
    inviteOnly:  lang === 'zh' ? '仅限受邀成员' : 'Invite-only members only',
  }

  // Error keys translated at render time — stays in sync when language toggles
  const errors = {
    'email-required':  lang === 'zh' ? '请输入邮箱' : 'Please enter your email',
    'email-failed':    lang === 'zh' ? '发送失败，请检查邮箱地址。' : 'Failed to send — check the email address.',
    'google-failed':   lang === 'zh' ? 'Google 登录失败，请重试。' : 'Google sign-in failed. Please try again.',
    'phone-required':  lang === 'zh' ? '请输入手机号' : 'Please enter your phone number',
    'phone-failed':    lang === 'zh' ? '发送失败，请确认包含国家代码（如 +86 或 +1）。' : 'Failed to send — include your country code, e.g. +1 or +86.',
    'otp-required':    lang === 'zh' ? '请输入验证码' : 'Please enter the code',
    'otp-invalid':     lang === 'zh' ? '验证码无效，请重试。' : 'Invalid code — please try again.',
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
    } catch (e) {
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

  const clearRecaptcha = () => {
    if (recaptchaRef.current) { recaptchaRef.current.clear(); recaptchaRef.current = null }
  }

  const handleSendCode = async () => {
    if (!phone.trim()) { setError('phone-required'); return }
    setLoading(true); setError('')
    try {
      clearRecaptcha()
      recaptchaRef.current = new RecaptchaVerifier(auth, 'phone-recaptcha', { size: 'invisible' })
      const result = await signInWithPhoneNumber(auth, phone.trim(), recaptchaRef.current)
      confirmationRef.current = result
      setPhoneStep('enter-otp')
    } catch (e) {
      setError('phone-failed')
      clearRecaptcha()
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError('otp-required'); return }
    setLoading(true); setError('')
    try {
      const result = await confirmationRef.current.confirm(otp.trim())
      await redirectAfterAuth(result.user.uid, navigate)
    } catch (e) {
      setError('otp-invalid')
    } finally { setLoading(false) }
  }

  const resetPhone = () => {
    setPhoneStep('idle'); setPhone(''); setOtp(''); setError(''); clearRecaptcha()
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
          /* ── Confirmation state ── */
          <div className="auth-sent">
            <div className="auth-sent-icon">✦</div>
            <p className="auth-sent-title">{t.sentTitle}</p>
            <p className="auth-sent-sub">{t.sentSub}</p>
            <p className="auth-spam-note">{lang === 'zh' ? '如果没有收到，请检查垃圾邮件文件夹。' : "If you don't see it, please check your spam folder."}</p>
            <p className="auth-sent-email">{email}</p>
            <button className="auth-resend" onClick={() => setSent(false)}>{t.resend}</button>
          </div>
        ) : (
          <>
            {/* ── Email magic link ── */}
            <div className="auth-email-row">
              <input
                className="auth-input"
                type="email"
                placeholder={t.emailPh}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendLink()}
              />
              <button className="auth-send-btn" onClick={handleSendLink} disabled={loading}>
                {loading ? t.sending : t.sendLink}
              </button>
            </div>

            {error && <p className="auth-error">{errors[error] ?? error}</p>}

            {/* ── Divider ── */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">{t.orDivider}</span>
              <div className="auth-divider-line" />
            </div>

            {/* ── Social buttons ── */}
            <button className="auth-social-btn" onClick={handleGoogle}>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.google}
            </button>

            {/* ── Phone sign-in ── */}
            {phoneStep === 'idle' && (
              <button className="auth-social-btn" onClick={() => { setPhoneStep('enter-phone'); setError('') }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {t.phone}
              </button>
            )}

            {phoneStep === 'enter-phone' && (
              <div className="auth-phone-section">
                <div className="auth-email-row">
                  <input
                    className="auth-input"
                    type="tel"
                    placeholder={lang === 'zh' ? '+86 138 0000 0000' : '+1 650 555 1234'}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                    autoFocus
                  />
                  <button className="auth-send-btn" onClick={handleSendCode} disabled={loading}>
                    {loading ? (lang === 'zh' ? '发送中…' : 'Sending…') : (lang === 'zh' ? '发送验证码' : 'Send Code')}
                  </button>
                </div>
                <button className="auth-phone-back" onClick={resetPhone}>
                  {lang === 'zh' ? '← 返回' : '← Back'}
                </button>
              </div>
            )}

            {phoneStep === 'enter-otp' && (
              <div className="auth-phone-section">
                <p className="auth-phone-hint">
                  {lang === 'zh' ? `验证码已发送至 ${phone}` : `Code sent to ${phone}`}
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

            <div id="phone-recaptcha" />
          </>
        )}
      </div>

      <p className="auth-footer">✦ {t.inviteOnly}</p>
    </div>
  )
}
