'use client'

import { useEffect, useState, useCallback } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  size: number
}

interface FireworksProps {
  onComplete?: () => void
}

const COLORS = ['#C9A84C', '#E8D48B', '#2ECC71', '#E74C3C', '#F39C12', '#4A90D9', '#FFFFFF']

export default function Fireworks({ onComplete }: FireworksProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [show, setShow] = useState(true)

  const burst = useCallback((cx: number, cy: number) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.3
      const speed = 2 + Math.random() * 4
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        size: 2 + Math.random() * 3,
      })
    }
    setParticles((prev) => [...prev, ...newParticles])
  }, [])

  useEffect(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 400
    const h = typeof window !== 'undefined' ? window.innerHeight : 600
    burst(w * 0.5, h * 0.4)
    setTimeout(() => burst(w * 0.3, h * 0.3), 200)
    setTimeout(() => burst(w * 0.7, h * 0.35), 400)
    setTimeout(() => burst(w * 0.5, h * 0.5), 600)
  }, [burst])

  useEffect(() => {
    if (particles.length === 0) return
    const interval = setInterval(() => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.05,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
        if (next.length === 0) {
          clearInterval(interval)
          setTimeout(() => setShow(false), 300)
        }
        return next
      })
    }, 20)
    return () => clearInterval(interval)
  }, [particles.length])

  useEffect(() => {
    if (!show && onComplete) {
      onComplete()
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            opacity: Math.max(0, p.life),
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  )
}
