'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api'

const RANK_STYLE: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: '#FEF3C7', color: '#92400E', label: '🥇' },
  2: { bg: '#F3F4F6', color: '#374151', label: '🥈' },
  3: { bg: '#FEF0E8', color: 'var(--vl-orange-hover)', label: '🥉' },
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false))
  }, [])

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--vl-bg)', minHeight: '100vh', padding: '2rem 1.25rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <Link href="/events" style={{ fontSize: '0.875rem', color: 'var(--vl-muted)' }}>
              ← Evenimente
            </Link>
            <h1 style={{
              fontFamily: 'var(--vl-font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--vl-dark)',
              marginTop: '0.75rem',
            }}>
              Clasament voluntari
            </h1>
            <p style={{ color: 'var(--vl-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Top voluntari după punctele acumulate
            </p>
          </div>

          {error && (
            <div style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)', borderRadius: 8, padding: '12px 16px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {fetching ? (
            <p style={{ color: 'var(--vl-muted)', textAlign: 'center', padding: '3rem 0' }}>Se încarcă...</p>
          ) : entries.length === 0 ? (
            <div style={{
              background: 'var(--vl-surface)',
              border: '1px solid var(--vl-border)',
              borderRadius: 'var(--vl-radius-lg)',
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--vl-muted)',
            }}>
              <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏆</p>
              Niciun voluntar în clasament încă.
            </div>
          ) : (
            <div style={{
              background: 'var(--vl-surface)',
              border: '1px solid var(--vl-border)',
              borderRadius: 'var(--vl-radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--vl-shadow-sm)',
            }}>
              {entries.map((entry, i) => {
                const rankStyle = RANK_STYLE[entry.rank]
                const isTop3 = entry.rank <= 3
                return (
                  <div
                    key={entry.user_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderBottom: i < entries.length - 1 ? '1px solid var(--vl-border)' : 'none',
                      background: isTop3 ? rankStyle.bg : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isTop3 ? 'white' : 'var(--vl-surface-raised)',
                      border: '1px solid var(--vl-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: isTop3 ? '1rem' : '0.8rem',
                      fontWeight: 700,
                      color: isTop3 ? rankStyle.color : 'var(--vl-muted)',
                    }}>
                      {isTop3 ? rankStyle.label : entry.rank}
                    </div>

                    {/* Email + badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600,
                        color: 'var(--vl-dark)',
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.email}
                      </p>
                      {entry.badge_count > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--vl-muted)', marginTop: 2 }}>
                          {entry.badge_count} {entry.badge_count === 1 ? 'insignă' : 'insigne'}
                        </p>
                      )}
                    </div>

                    {/* Points */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        fontFamily: 'var(--vl-font-display)',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: isTop3 ? rankStyle.color : 'var(--vl-dark)',
                        lineHeight: 1,
                      }}>
                        {entry.total_points}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--vl-muted)', marginTop: 2 }}>puncte</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
