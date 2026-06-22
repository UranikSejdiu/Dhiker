'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAppTheme } from '@/lib/theme-context'
import { useLanguage } from '@/lib/language-context'
import { themeNames, themes } from '@/lib/theme'
import { APP_VERSION } from '@/constants/version'
import Fireworks from '@/components/Fireworks'
import FlagIcon from '@/components/FlagIcon'

interface RawDhikr {
  id: string
  user_id: string
  name: string
  total_count: number
  daily_count: number
  daily_limit: number | null
  last_reset_date: string
  created_at: string
}

interface DhikrUI {
  id: string
  name: string
  totalCount: number
  dailyCount: number
  dailyLimit: number | null
}

const LANGUAGES = [
  { code: 'en' as const, name: 'English', countryCode: 'gb' },
  { code: 'de' as const, name: 'Deutsch', countryCode: 'de' },
  { code: 'fr' as const, name: 'Français', countryCode: 'fr' },
  { code: 'sq' as const, name: 'Shqip', countryCode: 'al' },
]

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { colors, themeName, setTheme } = useAppTheme()
  const { t, language, setLanguage } = useLanguage()

  const [dhikrs, setDhikrs] = useState<DhikrUI[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFireworks, setShowFireworks] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const [showDhikrsPanel, setShowDhikrsPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  const [dhikrModalVisible, setDhikrModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newDhikrName, setNewDhikrName] = useState('')
  const [newDhikrLimit, setNewDhikrLimit] = useState('')
  const [modalError, setModalError] = useState('')

  const pendingRef = useRef<Record<string, number>>({})
  const syncTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const fadeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (fadeRef.current) {
      fadeRef.current.style.opacity = '1'
      fadeRef.current.style.transform = 'translateY(0)'
    }
  }, [selectedId])

  // Auto-select first dhikr or restore last selected
  useEffect(() => {
    if (dhikrs.length > 0) {
      const saved = localStorage.getItem('dhikr_selected_id')
      if (saved && dhikrs.some((d) => d.id === saved)) {
        setSelectedId(saved)
      } else if (!selectedId) {
        setSelectedId(dhikrs[0].id)
      }
    }
  }, [dhikrs])

  // Save selected dhikr to localStorage
  useEffect(() => {
    if (selectedId) {
      localStorage.setItem('dhikr_selected_id', selectedId)
    }
  }, [selectedId])

  const fetchDhikrs = useCallback(async () => {
    try {
      setSyncError(null)
      const res = await fetch('/api/dhikrs')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const mapped: DhikrUI[] = (data.dhikrs || []).map((d: RawDhikr) => ({
        id: d.id,
        name: d.name,
        totalCount: d.total_count + (pendingRef.current[d.id] || 0),
        dailyCount: d.daily_count + (pendingRef.current[d.id] || 0),
        dailyLimit: d.daily_limit,
      }))
      setDhikrs(mapped)
      setLoading(false)
    } catch {
      setSyncError('Failed to connect to server')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user) fetchDhikrs()
  }, [session, fetchDhikrs])

  useEffect(() => {
    if (!session?.user) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchDhikrs()
    }, 10000)
    return () => clearInterval(interval)
  }, [session, fetchDhikrs])

  const syncNow = useCallback(async (deltas: Record<string, number>) => {
    if (Object.keys(deltas).length === 0) return
    try {
      await fetch('/api/dhikrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', deltas }),
      })
      fetchDhikrs()
    } catch { /* ignore */ }
  }, [fetchDhikrs])

  const scheduleSync = useCallback((id: string) => {
    if (syncTimerRef.current[id]) clearTimeout(syncTimerRef.current[id])
    syncTimerRef.current[id] = setTimeout(() => {
      const deltas: Record<string, number> = {}
      Object.entries(pendingRef.current).forEach(([k, v]) => {
        if (v !== 0) deltas[k] = v
      })
      if (Object.keys(deltas).length > 0) {
        Object.keys(deltas).forEach((k) => { pendingRef.current[k] = 0 })
        syncNow(deltas)
      }
    }, 2000)
  }, [syncNow])

  const increment = useCallback(async (id: string) => {
    const dhikr = dhikrs.find((d) => d.id === id)
    if (!dhikr) return

    if (dhikr.dailyLimit !== null && dhikr.dailyCount >= dhikr.dailyLimit) {
      setShowLimitWarning(true)
      setTimeout(() => setShowLimitWarning(false), 2000)
      return
    }

    const isHittingLimit = dhikr.dailyLimit !== null && (dhikr.dailyCount + 1 === dhikr.dailyLimit)

    pendingRef.current[id] = (pendingRef.current[id] || 0) + 1

    setDhikrs((current) =>
      current.map((d) =>
        d.id === id
          ? { ...d, dailyCount: d.dailyCount + 1, totalCount: d.totalCount + 1 }
          : d
      )
    )

    if (isHittingLimit) setShowFireworks(true)

    scheduleSync(id)
  }, [dhikrs, scheduleSync])

  const cycleDhikr = useCallback((dir: 'prev' | 'next') => {
    if (dhikrs.length === 0) return
    setShowLimitWarning(false)
    const idx = dhikrs.findIndex((d) => d.id === selectedId)
    const newIdx = dir === 'next'
      ? (idx + 1) % dhikrs.length
      : (idx - 1 + dhikrs.length) % dhikrs.length
    setSelectedId(dhikrs[newIdx].id)
  }, [dhikrs, selectedId])

  const addDhikr = useCallback(async (name: string, dailyLimit: number | null) => {
    try {
      const res = await fetch('/api/dhikrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', name, daily_limit: dailyLimit }),
      })
      if (!res.ok) throw new Error('Failed to add')
      await fetchDhikrs()
    } catch { /* ignore */ }
  }, [fetchDhikrs])

  const deleteDhikr = useCallback(async (id: string) => {
    try {
      await fetch(`/api/dhikrs/${id}`, { method: 'DELETE' })
      if (selectedId === id) setSelectedId(null)
      setShowDhikrsPanel(false)
      await fetchDhikrs()
    } catch { /* ignore */ }
  }, [fetchDhikrs, selectedId])

  const updateDhikr = useCallback(async (id: string, name: string, dailyLimit: number | null) => {
    try {
      await fetch(`/api/dhikrs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, daily_limit: dailyLimit }),
      })
      await fetchDhikrs()
    } catch { /* ignore */ }
  }, [fetchDhikrs])

  const resetDaily = useCallback(async (id: string) => {
    try {
      delete pendingRef.current[id]
      await fetch(`/api/dhikrs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', reset_total: true }),
      })
      await fetchDhikrs()
    } catch { /* ignore */ }
  }, [fetchDhikrs])

  const selected = dhikrs.find((d) => d.id === selectedId) || null
  const isAdmin = (session?.user as any)?.role === 'admin'

  useEffect(() => {
    const handleBeforeUnload = () => {
      const deltas: Record<string, number> = {}
      Object.entries(pendingRef.current).forEach(([k, v]) => {
        if (v !== 0) deltas[k] = v
      })
      if (Object.keys(deltas).length === 0) return
      navigator.sendBeacon('/api/dhikrs', JSON.stringify({ action: 'sync', deltas }))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ─── Modal handlers ───

  const openCreateModal = () => {
    setEditingId(null)
    setNewDhikrName('')
    setNewDhikrLimit('')
    setModalError('')
    setDhikrModalVisible(true)
  }

  const openEditModal = (id: string, name: string, limit: number | null) => {
    setEditingId(id)
    setNewDhikrName(name)
    setNewDhikrLimit(limit ? String(limit) : '')
    setModalError('')
    setDhikrModalVisible(true)
  }

  const handleSaveDhikr = async () => {
    setModalError('')
    if (!newDhikrName.trim()) {
      setModalError(t('errorNoName'))
      return
    }
    const limit = newDhikrLimit ? parseInt(newDhikrLimit, 10) : null
    if (limit !== null && (isNaN(limit) || limit <= 0)) {
      setModalError(t('errorLimitPositive'))
      return
    }
    try {
      if (editingId) {
        await updateDhikr(editingId, newDhikrName.trim(), limit)
      } else {
        await addDhikr(newDhikrName.trim(), limit)
      }
      setDhikrModalVisible(false)
    } catch (e: any) {
      setModalError(e.message)
    }
  }

  const handleDeleteDhikr = (id: string, name: string) => {
    setConfirmAction({
      title: t('deleteConfirmTitle'),
      message: t('deleteConfirmBody', { name }),
      onConfirm: () => { deleteDhikr(id); setConfirmAction(null) },
    })
  }

  // ─── Styles ───

  const c = colors

  const s = {
    container: { flex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column' as const, backgroundColor: c.background, paddingBottom: 100 },
    topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 20px 20px' },
    navBtn: { padding: 10, color: c.textSecondary, fontSize: 50, fontWeight: 300, lineHeight: '50px', background: 'none', border: 'none', cursor: 'pointer' } as const,
    dhikrName: { color: c.success, fontSize: 16, fontWeight: 600, textAlign: 'center' as const, lineHeight: '22px', flex: 1, padding: '0 10px', overflow: 'hidden' },
    counterArea: { flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', userSelect: 'none', WebkitTapHighlightColor: 'transparent', cursor: 'pointer' } as const,
    massiveNumber: { color: c.textSecondary, fontSize: 160, fontWeight: 200, letterSpacing: -5, textAlign: 'center' as const } as const,
    warningBox: { position: 'absolute' as const, bottom: 100, backgroundColor: c.error + '1A', padding: '10px 20px', borderRadius: 20, border: `1px solid ${c.error}4D` },
    warningText: { color: c.error, fontSize: 14, fontWeight: 500, textAlign: 'center' as const },
    emptyState: { flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', padding: '0 40px' },
    emptyIcon: { fontSize: 56, color: c.primary, marginBottom: 16, opacity: 0.6 },
    emptyTitle: { color: c.text, fontSize: 24, fontWeight: 600, marginBottom: 8 },
    emptySubtitle: { color: c.textSecondary, fontSize: 15, marginBottom: 32, textAlign: 'center' as const },
    emptyBtn: { backgroundColor: c.surface, border: `1px solid ${c.primary}40`, borderRadius: 14, padding: '14px 28px', color: c.primary, fontSize: 16, fontWeight: 600, cursor: 'pointer' } as const,
    toolbarWrapper: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '8px 0 max(env(safe-area-inset-bottom, 20px), 20px)', pointerEvents: 'none' as const, zIndex: 10 } as const,
    toolbar: { display: 'flex', alignItems: 'center', backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 32, padding: '10px 8px', boxShadow: `0 2px 8px ${c.overlay}`, pointerEvents: 'auto' as const } as const,
    toolItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '0 22px', gap: 4 },
    toolBtn: { width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textSecondary, fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' } as const,
    toolLabel: { color: c.textMuted, fontSize: 10, fontWeight: 500, textAlign: 'center' as const },
    toolDivider: { width: 1, height: 32, backgroundColor: c.border, opacity: 0.5 },
    overlay: { position: 'fixed' as const, inset: 0, backgroundColor: c.overlay, zIndex: 100, display: 'flex', flexDirection: 'column' as const, justifyContent: 'flex-end' } as const,
    panel: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85vh', borderTop: `1px solid ${c.border}`, animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column' as const } as const,
    handleRow: { display: 'flex', justifyContent: 'center', padding: '12px 0 4px' },
    handle: { width: 40, height: 4, backgroundColor: c.textSecondary + '80', borderRadius: 2 },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${c.border}` },
    panelTitle: { color: c.text, fontSize: 22, fontWeight: 700 },
    panelAddBtn: { backgroundColor: c.surfaceLight, padding: '8px 16px', borderRadius: 20, border: `1px solid ${c.border}`, color: c.primary, fontWeight: 600, fontSize: 14, cursor: 'pointer' } as const,
    panelClose: { color: c.textSecondary, fontSize: 20, padding: 4, background: 'none', border: 'none', cursor: 'pointer' } as const,
    panelBody: { padding: 16, overflowY: 'auto' as const, flex: 1 },
    dhikrCard: { backgroundColor: c.surfaceLight, borderRadius: 14, padding: 16, border: `1px solid ${c.card}`, marginBottom: 12 },
    dhikrCardSelected: { borderColor: `${c.primary}60` },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { color: c.text, fontSize: 18, fontWeight: 600, flex: 1, marginRight: 8 },
    cardActions: { display: 'flex', gap: 4 },
    cardActionBtn: { padding: 6, color: c.textSecondary, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' } as const,
    cardCounts: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardDaily: { color: c.primary, fontSize: 14, fontWeight: 600 },
    cardTotal: { color: c.textMuted, fontSize: 12 },
    progressTrack: { height: 4, backgroundColor: c.card, borderRadius: 2, overflow: 'hidden', marginTop: 10 },
    progressFill: { height: '100%', borderRadius: 2, backgroundColor: c.primary },
    settingsBody: { padding: 24, overflowY: 'auto' as const, flex: 1, minHeight: 0 },
    sectionLabel: { color: c.textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 24 },
    settingsCard: { backgroundColor: c.surfaceLight, borderRadius: 14, border: `1px solid ${c.card}`, overflow: 'hidden' as const },
    settingsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    settingsRowLabel: { color: c.text, fontSize: 15 },
    settingsRowValue: { color: c.textSecondary, fontSize: 15, maxWidth: '55%', textAlign: 'right' as const },
    settingsDivider: { height: 1, backgroundColor: c.card, marginLeft: 16 },
    swatchContainer: { display: 'flex', gap: 8 },
    swatch: { width: 32, height: 32, borderRadius: 16, border: '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as const,
    swatchSelected: { borderColor: c.primary },
    swatchInner: { width: 14, height: 14, borderRadius: 7 },
    langContainer: { display: 'flex', flexWrap: 'wrap' as const, gap: 10 },
    langBtn: { display: 'flex', alignItems: 'center', backgroundColor: c.surfaceLight, border: `1px solid ${c.card}`, borderRadius: 20, padding: '10px 16px', gap: 8, cursor: 'pointer' } as const,
    langBtnActive: { borderColor: c.primary, backgroundColor: c.surface },
    langText: { color: c.textSecondary, fontSize: 14, fontWeight: 600 },
    langTextActive: { color: c.primary },
    logoutBtn: { backgroundColor: `${c.error}1A`, padding: 16, borderRadius: 14, textAlign: 'center' as const, border: `1px solid ${c.error}4D`, marginTop: 32, color: c.error, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%' } as const,
    formOverlay: { position: 'fixed' as const, inset: 0, backgroundColor: c.overlay, zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 },
    formContent: { backgroundColor: c.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, border: `1px solid ${c.card}` },
    formTitle: { color: c.text, fontSize: 22, fontWeight: 700, marginBottom: 20 },
    formError: { color: c.error, marginBottom: 16, fontSize: 14 },
    formLabel: { color: c.textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 6, marginLeft: 4 },
    formInput: { backgroundColor: c.background, border: `1px solid ${c.card}`, borderRadius: 12, padding: 14, color: c.text, fontSize: 16, marginBottom: 16, width: '100%' } as const,
    formButtons: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
    formCancelBtn: { padding: '12px 20px', color: c.textSecondary, fontWeight: 600, fontSize: 15, background: 'none', border: 'none', cursor: 'pointer' } as const,
    formSaveBtn: { padding: '12px 24px', borderRadius: 12, backgroundColor: c.primary, color: c.background, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' } as const,
    panelEmpty: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '48px 0 32px' },
    panelEmptyIcon: { fontSize: 40, color: c.textMuted, marginBottom: 12, opacity: 0.5 },
    panelEmptyText: { color: c.textSecondary, fontSize: 16, fontWeight: 600, marginBottom: 4 },
    panelEmptySubtext: { color: c.textMuted, fontSize: 13 },
    limitReachedDaily: { color: c.success },
    adminLink: { color: c.primary, fontWeight: 700 },
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <p style={{ color: c.textSecondary }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={s.container}>
      {showFireworks && <Fireworks onComplete={() => setShowFireworks(false)} />}

      {selected ? (
        <>
          <div style={s.topBar}>
            <button style={s.navBtn} onClick={() => cycleDhikr('prev')}>‹</button>
            <div style={s.dhikrName}>{selected.name}</div>
            <button style={s.navBtn} onClick={() => cycleDhikr('next')}>›</button>
          </div>

          <div ref={fadeRef} style={{ ...s.counterArea, opacity: 0, transform: 'translateY(10px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }} onClick={() => increment(selected.id)}>
            <div style={s.massiveNumber}>{selected.totalCount.toLocaleString()}</div>
            {showLimitWarning && (
              <div style={s.warningBox}>
                <div style={s.warningText}>{t('changeLimitWarning')}</div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>☪</div>
          <div style={s.emptyTitle}>{t('noDhikrsYet')}</div>
          <div style={s.emptySubtitle}>{t('addFirstDhikr')}</div>
          <button style={s.emptyBtn} onClick={openCreateModal}>{t('addDhikrBtn')}</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={s.toolbarWrapper}>
        <div style={s.toolbar}>
          <div style={s.toolItem}>
            <button style={s.toolBtn} onClick={() => {
              if (selectedId) setConfirmAction({
                title: t('resetLabel'),
                message: t('resetDhikrConfirm'),
                onConfirm: () => { resetDaily(selectedId); setConfirmAction(null) },
              })
            }}>↺</button>
            <span style={s.toolLabel}>{t('resetLabel')}</span>
          </div>
          <div style={s.toolDivider} />
          <div style={s.toolItem}>
            <button style={s.toolBtn} onClick={() => setShowDhikrsPanel(true)}>☰</button>
            <span style={s.toolLabel}>{t('dhikrsLabel')}</span>
          </div>
          <div style={s.toolDivider} />
          <div style={s.toolItem}>
            <button style={s.toolBtn} onClick={() => setShowSettingsPanel(true)}>⚙</button>
            <span style={s.toolLabel}>{t('settingsLabel')}</span>
          </div>
        </div>
      </div>

      {/* Dhikrs Panel */}
      {showDhikrsPanel && (
        <div style={s.overlay} onClick={() => setShowDhikrsPanel(false)}>
          <div style={s.panel} onClick={(e) => e.stopPropagation()}>
            <div style={s.handleRow}><div style={s.handle} /></div>
            <div style={s.panelHeader}>
              <div style={s.panelTitle}>{t('myDhikrs')}</div>
              <button style={s.panelAddBtn} onClick={openCreateModal}>{t('newBtn')}</button>
            </div>
            <div style={s.panelBody}>
              {dhikrs.length === 0 ? (
                <div style={s.panelEmpty}>
                  <div style={s.panelEmptyIcon}>☰</div>
                  <div style={s.panelEmptyText}>{t('noDhikrsAdded')}</div>
                  <div style={s.panelEmptySubtext}>{t('tapNewToCreate')}</div>
                </div>
              ) : (
                [...dhikrs].sort((a, b) => a.id === selectedId ? -1 : b.id === selectedId ? 1 : 0).map((d) => {
                  const dailyColor = d.dailyLimit !== null
                    ? d.dailyCount >= d.dailyLimit ? c.success
                      : d.dailyCount >= d.dailyLimit * 0.7 ? c.warning
                      : c.error
                    : c.primary
                  const progress = d.dailyLimit !== null ? Math.min(d.dailyCount / d.dailyLimit, 1) : 0
                  return (
                    <div
                      key={d.id}
                      onClick={() => { setSelectedId(d.id); setShowDhikrsPanel(false) }}
                      style={{ ...s.dhikrCard, borderColor: d.id === selectedId ? `${c.primary}60` : c.card, cursor: 'pointer' }}
                    >
                      <div style={s.cardHeader}>
                        <div style={s.cardTitle}>{d.name}</div>
                        <div style={s.cardActions}>
                          <button style={s.cardActionBtn} onClick={(e) => { e.stopPropagation(); openEditModal(d.id, d.name, d.dailyLimit) }}>✎</button>
                          <button style={{ ...s.cardActionBtn, color: c.error }} onClick={(e) => { e.stopPropagation(); handleDeleteDhikr(d.id, d.name) }}>✕</button>
                        </div>
                      </div>
                      <div style={s.cardCounts}>
                        <span style={s.cardTotal}>{t('totalLabel')} {d.totalCount}</span>
                        {d.dailyLimit !== null && (
                          <span style={{ ...s.cardDaily, color: dailyColor }}>
                            {t('todayLabel')} {d.dailyCount}/{d.dailyLimit}
                          </span>
                        )}
                      </div>
                      {d.dailyLimit !== null && (
                        <div style={s.progressTrack}>
                          <div style={{ ...s.progressFill, width: `${progress * 100}%`, backgroundColor: d.dailyCount >= d.dailyLimit ? c.success : c.primary }} />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div style={{ height: 32 }} />
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <div style={s.overlay} onClick={() => setShowSettingsPanel(false)}>
          <div style={s.panel} onClick={(e) => e.stopPropagation()}>
            <div style={s.handleRow}><div style={s.handle} /></div>
            <div style={s.panelHeader}>
              <div style={s.panelTitle}>{t('settings')}</div>
              <button style={s.panelClose} onClick={() => setShowSettingsPanel(false)}>✕</button>
            </div>
            <div style={s.settingsBody}>
              {/* Account */}
              <div style={s.sectionLabel}>{t('accountSection')}</div>
              <div style={s.settingsCard}>
                <div style={s.settingsRow}>
                  <span style={s.settingsRowLabel}>{t('displayName')}</span>
                  <span style={s.settingsRowValue}>{session?.user?.email || 'User'}</span>
                </div>
                <div style={s.settingsDivider} />
                <div style={s.settingsRow}>
                  <span style={s.settingsRowLabel}>Email</span>
                  <span style={s.settingsRowValue}>{session?.user?.email}</span>
                </div>
                {isAdmin && (
                  <>
                    <div style={s.settingsDivider} />
                    <button style={s.settingsRow} onClick={() => { setShowSettingsPanel(false); setTimeout(() => setShowAdminPanel(true), 300) }}>
                      <span style={{ ...s.settingsRowLabel, ...s.adminLink }}>{t('adminPanel')}</span>
                      <span style={{ ...s.settingsRowValue, color: c.primary }}>→</span>
                    </button>
                  </>
                )}
              </div>

              {/* Appearance */}
              <div style={s.sectionLabel}>{t('appearanceSection')}</div>
              <div style={s.settingsCard}>
                <div style={s.settingsRow}>
                  <span style={s.settingsRowLabel}>Theme</span>
                  <div style={s.swatchContainer}>
                    {themeNames.map((name) => {
                      const tColors = themes[name]
                      return (
                        <button
                          key={name}
                          onClick={() => setTheme(name)}
                          style={{ ...s.swatch, backgroundColor: tColors.background, borderColor: themeName === name ? c.primary : 'transparent' }}
                        >
                          <div style={{ ...s.swatchInner, backgroundColor: tColors.primary }} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Language */}
              <div style={s.sectionLabel}>{t('languageSection')}</div>
              <div style={s.langContainer}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    style={{ ...s.langBtn, borderColor: language === l.code ? c.primary : c.card, backgroundColor: language === l.code ? c.surface : c.surfaceLight }}
                  >
                    <FlagIcon countryCode={l.countryCode} size={18} />
                    <span style={{ ...s.langText, color: language === l.code ? c.primary : c.textSecondary }}>{l.name}</span>
                  </button>
                ))}
              </div>

              {/* Sync */}
              <div style={s.sectionLabel}>SYNC</div>
              <div style={s.settingsCard}>
                <button style={s.settingsRow} onClick={fetchDhikrs}>
                  <span style={s.settingsRowLabel}>Refresh from server</span>
                  {syncError && <span style={{ ...s.settingsRowValue, color: c.error, fontSize: 12 }}>{syncError}</span>}
                </button>
                {syncError && (
                  <>
                    <div style={s.settingsDivider} />
                    <button style={s.settingsRow} onClick={fetchDhikrs}>
                      <span style={{ ...s.settingsRowLabel, color: c.error }}>Retry sync</span>
                    </button>
                  </>
                )}
              </div>

              {/* About */}
              <div style={s.sectionLabel}>{t('aboutSection')}</div>
              <div style={s.settingsCard}>
                <div style={s.settingsRow}>
                  <span style={s.settingsRowLabel}>{t('version')}</span>
                  <span style={s.settingsRowValue}>{APP_VERSION}</span>
                </div>
                <div style={s.settingsDivider} />
                <div style={s.settingsRow}>
                  <span style={s.settingsRowLabel}>{t('madeBy')}</span>
                  <span style={s.settingsRowValue}>Uranik Sejdiu</span>
                </div>
              </div>

              <button style={s.logoutBtn} onClick={() => {
                setConfirmAction({
                  title: t('signOut'),
                  message: t('signOutConfirm'),
                  onConfirm: async () => {
                    setConfirmAction(null)
                    const { signOut } = await import('next-auth/react')
                    signOut({ callbackUrl: '/login' })
                  },
                })
              }}>
                {t('signOut')}
              </button>
              <div style={{ height: 40 }} />
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <div style={s.overlay} onClick={() => setShowAdminPanel(false)}>
          <div style={s.panel} onClick={(e) => e.stopPropagation()}>
            <div style={s.handleRow}><div style={s.handle} /></div>
            <AdminPanelContent onClose={() => setShowAdminPanel(false)} />
          </div>
        </div>
      )}

      {/* Add/Edit Dhikr Modal */}
      {dhikrModalVisible && (
        <div style={s.formOverlay} onClick={() => setDhikrModalVisible(false)}>
          <div style={s.formContent} onClick={(e) => e.stopPropagation()}>
            <div style={s.formTitle}>{editingId ? t('editDhikr') : t('newDhikr')}</div>
            {modalError && <div style={s.formError}>{modalError}</div>}
            <div style={s.formLabel}>{t('nameLabel')}</div>
            <input
              style={s.formInput}
              placeholder={t('namePlaceholder')}
              value={newDhikrName}
              onChange={(e) => setNewDhikrName(e.target.value)}
              autoFocus
            />
            <div style={s.formLabel}>{t('limitLabel')}</div>
            <input
              style={s.formInput}
              placeholder={t('limitPlaceholder')}
              value={newDhikrLimit}
              onChange={(e) => setNewDhikrLimit(e.target.value)}
              type="number"
            />
            <div style={s.formButtons}>
              <button style={s.formCancelBtn} onClick={() => setDhikrModalVisible(false)}>{t('cancel')}</button>
              <button style={s.formSaveBtn} onClick={handleSaveDhikr}>{t('saveBtn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: c.overlay, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }} onClick={() => setConfirmAction(null)}>
          <div style={{ backgroundColor: c.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, border: `1px solid ${c.card}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: c.text, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{confirmAction.title}</div>
            <div style={{ color: c.textSecondary, fontSize: 15, marginBottom: 24, lineHeight: '22px' }}>{confirmAction.message}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button style={{ padding: '12px 20px', color: c.textSecondary, fontWeight: 600, fontSize: 15, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setConfirmAction(null)}>{t('cancel')}</button>
              <button style={{ padding: '12px 24px', borderRadius: 12, backgroundColor: c.error, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }} onClick={confirmAction.onConfirm}>{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Admin Panel Content ───
function AdminPanelContent({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const { colors: c } = useAppTheme()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin').then((res) => {
      if (!res.ok) throw new Error('Admin access required')
      return res.json()
    }).then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) {
    return <div style={{ padding: 24, textAlign: 'center', color: c.error }}>{t('adminAccessOnly')}</div>
  }

  if (!data) {
    return <div style={{ padding: 24, textAlign: 'center', color: c.textSecondary }}>Loading...</div>
  }

  return (
    <div style={{ padding: 24, overflowY: 'auto' as const }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: c.text, fontSize: 22, fontWeight: 700, margin: 0 }}>{t('adminPanel')}</h2>
        <button onClick={onClose} style={{ color: c.textSecondary, fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: t('totalUsers'), value: data.total_users },
          { label: t('totalDhikrs'), value: data.total_dhikrs },
          { label: t('totalCounts'), value: data.total_counts.toLocaleString() },
        ].map((s) => (
          <div key={s.label} style={{ padding: 12, borderRadius: 12, backgroundColor: c.surfaceLight, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.text }}>{s.value}</div>
            <div style={{ fontSize: 11, color: c.textSecondary, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {data.users?.map((u: any) => (
        <div key={u.id} style={{ padding: 12, borderRadius: 12, backgroundColor: c.surfaceLight, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: c.text, fontWeight: 600, fontSize: 14 }}>{u.display_name || u.email}</div>
            <div style={{ color: c.textMuted, fontSize: 12 }}>{u.email} · {t('dhikrCount')}: {u.dhikr_count}</div>
          </div>
          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, backgroundColor: u.role === 'admin' ? `${c.primary}20` : c.card, color: u.role === 'admin' ? c.primary : c.textSecondary }}>
            {u.role}
          </span>
        </div>
      ))}
    </div>
  )
}
