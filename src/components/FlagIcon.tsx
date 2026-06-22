'use client'

import { useState } from 'react'

interface FlagIconProps {
  countryCode: string
  size?: number
}

export default function FlagIcon({ countryCode, size = 20 }: FlagIconProps) {
  const [failed, setFailed] = useState(false)
  const code = countryCode.toLowerCase()
  const uri = `https://flagcdn.com/w40/${code}.png`

  if (failed) {
    return (
      <span
        style={{
          width: Math.round(size * 1.4),
          height: size,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size - 4,
          backgroundColor: 'var(--card)',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}
      >
        {code.toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={uri}
      alt={`${countryCode.toUpperCase()} flag`}
      onError={() => setFailed(true)}
      style={{
        width: Math.round(size * 1.4),
        height: size,
        borderRadius: 2,
        display: 'block',
      }}
    />
  )
}
