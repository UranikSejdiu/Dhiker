'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useAppTheme } from '@/lib/theme-context'
import { useLanguage } from '@/lib/language-context'

const GOOGLE_G_SVG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>'
)

export default function RegisterPage() {
  const router = useRouter()
  const { colors: c } = useAppTheme()
  const { t } = useLanguage()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const fadeRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (fadeRef.current) { fadeRef.current.style.opacity = '1'; fadeRef.current.style.transform = 'translateY(0)' }
    if (slideRef.current) { slideRef.current.style.opacity = '1'; slideRef.current.style.transform = 'translateY(0)' }
    if (headerRef.current) { headerRef.current.style.opacity = '1'; headerRef.current.style.transform = 'scale(1)' }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('fillAllFields'))
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, displayName: displayName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed.'); setLoading(false); return }

      await signIn('credentials', { email: email.trim(), password, redirect: false })
      router.push('/')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogle = async () => { await signIn('google', { callbackUrl: '/' }) }

  const inputStyle = (field: string) => ({
    width: '100%',
    backgroundColor: c.surface,
    border: `1.5px solid ${focusedField === field ? c.primary : c.card}`,
    borderRadius: 14,
    padding: '15px 18px',
    fontSize: 16,
    color: c.text,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? `0 0 8px ${c.primary}30` : 'none',
  } as const)

  const inputWrap = { marginBottom: 16 }
  const label = { color: c.primary, fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: 0.5, textTransform: 'uppercase' as const }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: '28px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ width: 60, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${c.primary}, ${c.primaryLight}, ${c.primary})`, margin: '0 auto 8px' }} />

        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 32, opacity: 0, transform: 'scale(0.8)', transition: 'all 0.8s ease' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: c.surface, border: `2px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: `0 4px 12px ${c.primary}40` }}>
            <span style={{ fontSize: 34, color: c.primary }}>☪</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.text, letterSpacing: 0.8, marginBottom: 6 }}>{t('signUpBtn')}</div>
          <div style={{ fontSize: 20, color: c.primary, marginBottom: 6, fontWeight: 300 }}>بِسْمِ اللهِ</div>
          <div style={{ fontSize: 13, color: c.textSecondary, letterSpacing: 0.5 }}>{t('subtitle')}</div>
        </div>

        <div ref={fadeRef} style={{ opacity: 0, transform: 'translateY(30px)', transition: 'all 0.8s ease 0.1s' }}>
          {error && (
            <div style={{ backgroundColor: `${c.error}20`, border: `1px solid ${c.error}40`, borderRadius: 12, padding: 14, marginBottom: 18, textAlign: 'center', color: c.error, fontSize: 14, lineHeight: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={inputWrap}>
              <div style={label}>{t('displayNameLabel')}</div>
              <input style={inputStyle('displayName')} type="text" value={displayName} placeholder={t('displayNameLabel')} onChange={(e) => setDisplayName(e.target.value)} onFocus={() => setFocusedField('displayName')} onBlur={() => setFocusedField(null)} disabled={loading} />
            </div>
            <div style={inputWrap}>
              <div style={label}>{t('emailLabel')}</div>
              <input style={inputStyle('email')} type="email" value={email} placeholder={t('emailLabel')} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} disabled={loading} />
            </div>
            <div style={inputWrap}>
              <div style={label}>{t('passwordLabel')}</div>
              <input style={inputStyle('password')} type="password" value={password} placeholder={t('passwordLabel')} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} disabled={loading} />
            </div>
            <div style={inputWrap}>
              <div style={label}>{t('confirmPasswordLabel')}</div>
              <input style={inputStyle('confirmPassword')} type="password" value={confirmPassword} placeholder={t('passwordLabel')} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} disabled={loading} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', borderRadius: 14, padding: '17px', textAlign: 'center', background: `linear-gradient(135deg, ${c.primary}, ${c.primaryLight}, ${c.primary})`, boxShadow: `0 4px 12px ${c.primary}60`, border: 'none', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: 17, fontWeight: 700, color: c.background, letterSpacing: 0.8, margin: '6px 0 22px' }}>
              {loading ? '...' : t('signUpBtn')}
            </button>
          </form>

          <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', border: '1px solid #DADCE0', borderRadius: 14, padding: '15px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.08)', marginBottom: 22 }}>
            <img src={GOOGLE_G_SVG} alt="" style={{ width: 22, height: 22, marginRight: 16 }} />
            <span style={{ color: '#1F1F1F', fontSize: 16, fontWeight: 500, letterSpacing: 0.3 }}>{t('continueGoogle')}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: c.card }} />
            <span style={{ color: `${c.primary}50`, margin: '0 16px', fontSize: 12 }}>✦</span>
            <div style={{ flex: 1, height: 1, backgroundColor: c.card }} />
          </div>

          <div style={{ textAlign: 'center', padding: '8px 0', color: c.textSecondary, fontSize: 15 }}>
            {t('hasAccount')}{' '}
            <Link href="/login" style={{ color: c.primary, fontWeight: 600 }}>{t('signInBtn')}</Link>
          </div>

          <div style={{ width: '80%', height: 1, margin: '24px auto 0', background: `linear-gradient(90deg, transparent, ${c.primary}20, transparent)` }} />
        </div>
      </div>
    </div>
  )
}
