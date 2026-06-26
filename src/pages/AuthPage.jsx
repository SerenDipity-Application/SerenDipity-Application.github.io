import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useLang } from '../LangContext'
import './AuthPage.css'

// ── Google client ID (same as Firebase project) ────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

async function redirectAfterAuth() {
  try {
    const me = await api.users.getMe()
    if (me.onboardingStatus === 'completed') return '/directory'
    return '/onboarding'
  } catch {
    return '/onboarding'
  }
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { lang } = useLang()
  const { refreshUser } = useAuth()

  // ── Form state ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState('login')       // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Email magic link ───────────────────────────────────────────────────
  const [sent, setSent] = useState(false)
  const [emailStep, setEmailStep] = useState('idle') // 'idle' | 'enter-email'

  // ── Google One Tap ─────────────────────────────────────────────────────
  const [googleReady, setGoogleReady] = useState(false)

  // ── Magic link token in URL ───────────────────────────────────────────
  useEffect(() => {
    const magic = searchParams.get('magic')
    if (!magic) return
    setLoading(true)
    api.auth.verifyMagicToken(magic)
      .then(async () => {
        await refreshUser()
        const path = await redirectAfterAuth()
        navigate(path, { replace: true })
      })
      .catch(() => setError('magic-failed'))
      .finally(() => setLoading(false))
  }, [searchParams])

  // ── Init Google Identity Services ──────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    // Load the GIS script if not already loaded
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = initGoogle
      document.head.appendChild(script)
    } else {
      initGoogle()
    }

    return () => {
      // Cleanup — disable any active prompts
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [])

  function initGoogle() {
    if (!window.google?.accounts?.id) return
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      })
      setGoogleReady(true)
    } catch (e) {
      console.error('Google init error:', e)
    }
  }

  const handleGoogleCredential = useCallback(async (response) => {
    setError('')
    setLoading(true)
    try {
      await api.auth.google(response.credential)
      await refreshUser()
      const path = await redirectAfterAuth()
      navigate(path, { replace: true })
    } catch {
      setError('google-failed')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const handleGoogleClick = () => {
    if (!window.google?.accounts?.id) return
    window.google.accounts.id.prompt()
  }

  // ── i18n ───────────────────────────────────────────────────────────────
  const t = {
    heading:    lang === 'zh' ? '欢迎加入圈子' : 'Welcome to the Circle',
    sub:        lang === 'zh' ? '请验证你的身份以继续' : 'Verify your identity to continue',
    usernamePh: lang === 'zh' ? '用户名' : 'Username',
    passwordPh: lang === 'zh' ? '密码' : 'Password',
    confirmPh:  lang === 'zh' ? '确认密码' : 'Confirm password',
    emailPh:    lang === 'zh' ? '你的邮箱地址' : 'Your email address',
    loginBtn:   lang === 'zh' ? '登录' : 'Login',
    registerBtn:lang === 'zh' ? '注册' : 'Register',
    loading:    lang === 'zh' ? '处理中…' : 'Loading…',
    switchRegister: lang === 'zh' ? '还没有账号？注册' : "Don't have an account? Register",
    switchLogin:  lang === 'zh' ? '已有账号？登录' : 'Already have an account? Login',
    orDivider:   lang === 'zh' ? '或' : 'or',
    google:       lang === 'zh' ? '使用 Google 继续' : 'Continue with Google',
    emailBtn:     lang === 'zh' ? '使用邮箱继续' : 'Continue with Email',
    emailBack:    lang === 'zh' ? '← 返回' : '← Back',
    sendLink:     lang === 'zh' ? '发送魔法链接' : 'Send Magic Link',
    sending:      lang === 'zh' ? '发送中…' : 'Sending…',
    sentTitle:    lang === 'zh' ? '邮件已发送 ✦' : 'Check your inbox ✦',
    sentSub:      lang === 'zh' ? '我们已向以下邮箱发送了一个登录链接。点击链接即可登录，无需密码。' : 'We sent a sign-in link to the address below. Click it to sign in — no password needed.',
    resend:       lang === 'zh' ? '重新发送' : 'Resend',
    inviteOnly:   lang === 'zh' ? '仅限受邀成员' : 'Invite-only members only',
  }

  const errors = {
    'username-required': lang === 'zh' ? '请输入用户名' : 'Please enter a username',
    'password-required': lang === 'zh' ? '请输入密码' : 'Please enter a password',
    'password-short':    lang === 'zh' ? '密码至少 6 位' : 'Password must be at least 6 characters',
    'confirm-mismatch':  lang === 'zh' ? '两次密码不一致' : 'Passwords do not match',
    'login-failed':      lang === 'zh' ? '用户名或密码错误' : 'Invalid username or password',
    'register-failed':   lang === 'zh' ? '注册失败，用户名可能已存在' : 'Registration failed — username may be taken',
    'email-required':    lang === 'zh' ? '请输入邮箱' : 'Please enter your email',
    'email-failed':      lang === 'zh' ? '发送失败，请检查邮箱地址。' : 'Failed to send — check the email address.',
    'google-failed':     lang === 'zh' ? 'Google 登录失败，请重试。' : 'Google sign-in failed. Please try again.',
    'magic-failed':      lang === 'zh' ? '链接无效或已过期' : 'Link invalid or expired',
  }

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')

    if (!username.trim()) { setError('username-required'); return }
    if (!password) { setError('password-required'); return }
    if (password.length < 6) { setError('password-short'); return }

    if (mode === 'register') {
      if (password !== confirmPassword) { setError('confirm-mismatch'); return }
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await api.auth.register(username.trim(), password, email.trim() || null)
      } else {
        await api.auth.login(username.trim(), password)
      }
      await refreshUser()
      const path = await redirectAfterAuth()
      navigate(path, { replace: true })
    } catch (e) {
      setError(mode === 'register' ? 'register-failed' : 'login-failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSendLink = async () => {
    if (!email.trim()) { setError('email-required'); return }
    setLoading(true); setError('')
    try {
      await api.auth.sendEmailLink(email.trim())
      setSent(true)
    } catch {
      setError('email-failed')
    } finally {
      setLoading(false)
    }
  }

  const resetEmail = () => { setEmailStep('idle'); setError('') }

  // ── Render ─────────────────────────────────────────────────────────────
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
            {/* ── Username / Password form ── */}
            <form onSubmit={handleSubmit} className="auth-phone-section">
              <input
                className="auth-input"
                type="text"
                placeholder={t.usernamePh}
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
              <input
                className="auth-input"
                type="password"
                placeholder={t.passwordPh}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ marginTop: 8 }}
              />
              {mode === 'register' && (
                <>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder={t.confirmPh}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                  <input
                    className="auth-input"
                    type="email"
                    placeholder={t.emailPh}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </>
              )}
              <button className="auth-send-btn" type="submit" disabled={loading} style={{ marginTop: 12 }}>
                {loading ? t.loading : (mode === 'register' ? t.registerBtn : t.loginBtn)}
              </button>
              <button
                type="button"
                className="auth-phone-back"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              >
                {mode === 'login' ? t.switchRegister : t.switchLogin}
              </button>
            </form>

            {error && <p className="auth-error">{errors[error] ?? error}</p>}

            {/* TODO: restore divider + Google + Email when backend auth is ready */}
            {false && (
              <>
                {/* ── Divider ── */}
                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">{t.orDivider}</span>
                  <div className="auth-divider-line" />
                </div>

                {/* ── Google ── */}
                <button className="auth-social-btn" onClick={handleGoogleClick} disabled={!googleReady}>
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
          </>
        )}
      </div>

      <p className="auth-footer">✦ {t.inviteOnly}</p>
    </div>
  )
}
