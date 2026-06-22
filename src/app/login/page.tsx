'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppTheme } from '@/lib/theme-context'
import { useLanguage } from '@/lib/language-context'

const GOOGLE_G_SVG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>'
)

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { colors: c } = useAppTheme()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const fadeRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fade = fadeRef.current
    const header = headerRef.current
    if (fade) { fade.style.opacity = '1'; fade.style.transform = 'translateY(0)' }
    if (header) { header.style.opacity = '1'; header.style.transform = 'scale(1)' }
  }, [])

  const tokenError = searchParams.get('error')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(t('fillAllFields'))
      return
    }
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email: email.trim(), password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  const s = {
    page: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: '28px' },
    inner: { width: '100%', maxWidth: 420 },
    accentBar: { width: 60, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${c.primary}, ${c.primaryLight}, ${c.primary})`, margin: '0 auto 8px' },
    header: { textAlign: 'center' as const, marginBottom: 40, opacity: 0, transform: 'scale(0.8)', transition: 'all 0.8s ease' },
    iconCircle: { width: 90, height: 90, borderRadius: '50%', backgroundColor: c.surface, border: `2px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 4px 12px ${c.primary}40` },
    crescent: { fontSize: 42, color: c.primary },
    appTitle: { fontSize: 32, fontWeight: 700, color: c.text, letterSpacing: 1, marginBottom: 8 },
    bismillah: { fontSize: 22, color: c.primary, marginBottom: 6, fontWeight: 300 },
    subtitle: { fontSize: 14, color: c.textSecondary, letterSpacing: 0.5 },
    form: { opacity: 0, transform: 'translateY(30px)', transition: 'all 0.8s ease 0.1s' },
    errorBox: { backgroundColor: `${c.error}20`, border: `1px solid ${c.error}40`, borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'center' as const, color: c.error, fontSize: 14, lineHeight: '20px' },
    inputGroup: { marginBottom: 18 },
    inputLabel: { color: c.primary, fontSize: 13, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' as const },
    input: { width: '100%', backgroundColor: c.surface, border: `1.5px solid ${emailFocused ? c.primary : c.card}`, borderRadius: 14, padding: '16px 18px', fontSize: 16, color: c.text, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: emailFocused ? `0 0 8px ${c.primary}30` : 'none' } as const,
    inputPassword: { width: '100%', backgroundColor: c.surface, border: `1.5px solid ${passwordFocused ? c.primary : c.card}`, borderRadius: 14, padding: '16px 18px', fontSize: 16, color: c.text, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: passwordFocused ? `0 0 8px ${c.primary}30` : 'none' } as const,
    signInBtn: { width: '100%', borderRadius: 14, padding: '17px', textAlign: 'center' as const, background: `linear-gradient(135deg, ${c.primary}, ${c.primaryLight}, ${c.primary})`, boxShadow: `0 4px 12px ${c.primary}60`, border: 'none', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: 17, fontWeight: 700, color: c.background, letterSpacing: 0.8, margin: '8px 0 24px' } as const,
    googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', border: '1px solid #DADCE0', borderRadius: 14, padding: '15px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.08)', marginBottom: 24 },
    googleIcon: { width: 22, height: 22, marginRight: 16 },
    googleText: { color: '#1F1F1F', fontSize: 16, fontWeight: 500, letterSpacing: 0.3 },
    divider: { display: 'flex', alignItems: 'center', marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.card },
    dividerStar: { color: `${c.primary}50`, margin: '0 16px', fontSize: 12 },
    link: { textAlign: 'center' as const, padding: '8px 0', color: c.textSecondary, fontSize: 15 },
    linkHighlight: { color: c.primary, fontWeight: 600 },
    bottomAccent: { width: '80%', height: 1, margin: '32px auto 0', background: `linear-gradient(90deg, transparent, ${c.primary}20, transparent)` },
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.accentBar} />

        <div ref={headerRef} style={s.header}>
          <div style={s.iconCircle}>
            <span style={s.crescent}>☪</span>
          </div>
          <div style={s.appTitle}>{t('appTitle')}</div>
          <div style={s.bismillah}>بِسْمِ اللهِ</div>
          <div style={s.subtitle}>{t('subtitle')}</div>
        </div>

        <div ref={fadeRef} style={s.form}>
          {(error || tokenError) && (
            <div style={s.errorBox}>{error || tokenError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={s.inputGroup}>
              <div style={s.inputLabel}>{t('emailLabel')}</div>
              <input
                style={s.input}
                type="email"
                value={email}
                placeholder={t('emailLabel')}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                disabled={loading}
              />
            </div>

            <div style={s.inputGroup}>
              <div style={s.inputLabel}>{t('passwordLabel')}</div>
              <input
                style={s.inputPassword}
                type="password"
                value={password}
                placeholder={t('passwordLabel')}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                disabled={loading}
              />
            </div>

            <button type="submit" style={s.signInBtn} disabled={loading}>
              {loading ? '...' : t('signInBtn')}
            </button>
          </form>

          <button style={s.googleBtn} onClick={handleGoogle} disabled={loading}>
            <img src={GOOGLE_G_SVG} alt="" style={s.googleIcon} />
            <span style={s.googleText}>{t('continueGoogle')}</span>
          </button>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerStar}>✦</span>
            <div style={s.dividerLine} />
          </div>

          <div style={s.link}>
            {t('noAccount')}{' '}
            <Link href="/register" style={s.linkHighlight}>
              {t('signUpBtn')}
            </Link>
          </div>

          <div style={s.bottomAccent} />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  )
}
