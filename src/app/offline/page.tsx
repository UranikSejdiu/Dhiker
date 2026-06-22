'use client'

export default function OfflinePage() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-8 text-center"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
        You&apos;re Offline
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Some features may be unavailable. Your dhikr counts are saved locally and will sync when
        you&apos;re back online.
      </p>
    </div>
  )
}
