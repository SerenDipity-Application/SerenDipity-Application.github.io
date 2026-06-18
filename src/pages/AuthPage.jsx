import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { auth } from '../firebase'
import { useLang } from '../LangContext'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import './AuthPage.css'

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)

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
    apple:       lang === 'zh' ? '使用 Apple 继续' : 'Continue with Apple',
    appleNote:   lang === 'zh' ? '需要 Apple 开发者账户配置' : 'Requires Apple Developer setup',
    inviteOnly:  lang === 'zh' ? '仅限受邀成员' : 'Invite-only members only',
  }

  const handleSendLink = async () => {
    if (!email.trim()) { setError(lang === 'zh' ? '请输入邮箱' : 'Please enter your email'); return }
    setLoading(true)
    setError('')
    try {
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings)
      localStorage.setItem('serendipity_email_for_link', email.trim())
      setSent(true)
    } catch (e) {
      setError(lang === 'zh' ? '发送失败，请检查邮箱地址。' : 'Failed to send — check the email address.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      let result
      if (isMobile) {
        await signInWithRedirect(auth, provider)
        return
      } else {
        result = await signInWithPopup(auth, provider)
      }
      await redirectAfterAuth(result.user.uid, navigate)
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(lang === 'zh' ? 'Google 登录失败，请重试。' : 'Google sign-in failed. Please try again.')
      }
    }
  }

  const handleApple = async () => {
    setError('')
    try {
      const provider = new OAuthProvider('apple.com')
      provider.addScope('email')
      provider.addScope('name')
      const result = await signInWithPopup(auth, provider)
      await redirectAfterAuth(result.user.uid, navigate)
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(lang === 'zh' ? 'Apple 登录失败，请确认已在 Firebase 中配置 Apple 登录。' : 'Apple sign-in failed. Make sure Apple is configured in Firebase Console.')
      }
    }
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

            {error && <p className="auth-error">{error}</p>}

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

            <button className="auth-social-btn auth-apple-btn" onClick={handleApple}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {t.apple}
            </button>
          </>
        )}
      </div>

      <p className="auth-footer">✦ {t.inviteOnly}</p>
    </div>
  )
}
