'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { getMyStats, type UserStats } from '@/lib/api'

const BADGE_ICONS: Record<string, string> = {
  'Primul Pas':   '🌱',
  '5 Evenimente': '⭐',
  '10 Ore':       '🕐',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'var(--vl-surface)',
      border: '1px solid var(--vl-border)',
      borderRadius: 'var(--vl-radius-lg)',
      padding: '1.25rem 1.5rem',
      boxShadow: 'var(--vl-shadow-sm)',
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--vl-muted)', fontWeight: 500, marginBottom: 4 }}>{label}</p>
      <p style={{
        fontFamily: 'var(--vl-font-display)',
        fontSize: '2rem',
        fontWeight: 700,
        color: 'var(--vl-dark)',
        lineHeight: 1,
      }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--vl-muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

export default function RewardsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user) {
      getMyStats()
        .then(setStats)
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, loading, router])

  if (loading || fetching) return (
    <div style={{ minHeight: '100vh', background: 'var(--vl-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
    </div>
  )

  if (!user) return null

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--vl-bg)', minHeight: '100vh', padding: '2rem 1.25rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <Link href="/dashboard" style={{ fontSize: '0.875rem', color: 'var(--vl-muted)' }}>
              ← Dashboard
            </Link>
            <h1 style={{
              fontFamily: 'var(--vl-font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--vl-dark)',
              marginTop: '0.75rem',
            }}>
              Recompensele mele
            </h1>
          </div>

          {error && (
            <div style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)', borderRadius: 8, padding: '12px 16px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {stats && (
            <>
              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Puncte totale" value={stats.total_points} sub="acumulate" />
                <StatCard label="Ore voluntariat" value={stats.total_hours.toFixed(1)} sub="ore lucrate" />
                <StatCard label="Evenimente" value={stats.events_completed} sub="completate" />
              </div>

              {/* Badges */}
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontFamily: 'var(--vl-font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: 'var(--vl-dark)',
                  marginBottom: '1rem',
                }}>
                  Insigne ({stats.badges.length})
                </h2>

                {stats.badges.length === 0 ? (
                  <div style={{
                    background: 'var(--vl-surface)',
                    border: '1px solid var(--vl-border)',
                    borderRadius: 'var(--vl-radius-lg)',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--vl-muted)',
                    fontSize: '0.9rem',
                  }}>
                    <p style={{ fontSize: '2rem', marginBottom: 8 }}>🏅</p>
                    Nicio insignă încă. Completează primul voluntariat pentru a debloca prima ta insignă!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {stats.badges.map((badge) => (
                      <div key={badge.id} style={{
                        background: 'var(--vl-surface)',
                        border: '1px solid var(--vl-border)',
                        borderRadius: 'var(--vl-radius-lg)',
                        padding: '1.25rem',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        boxShadow: 'var(--vl-shadow-sm)',
                      }}>
                        <span style={{ fontSize: '1.75rem' }}>{BADGE_ICONS[badge.name] ?? '🏆'}</span>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--vl-dark)', fontSize: '0.9rem' }}>{badge.name}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--vl-muted)', marginTop: 2 }}>{badge.description}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--vl-placeholder)', marginTop: 4 }}>
                            {new Date(badge.awarded_at).toLocaleDateString('ro-RO')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Points history */}
              <section>
                <h2 style={{
                  fontFamily: 'var(--vl-font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: 'var(--vl-dark)',
                  marginBottom: '1rem',
                }}>
                  Istoric puncte
                </h2>

                {stats.recent_transactions.length === 0 ? (
                  <p style={{ color: 'var(--vl-muted)', fontSize: '0.9rem' }}>Nicio tranzacție încă.</p>
                ) : (
                  <div style={{
                    background: 'var(--vl-surface)',
                    border: '1px solid var(--vl-border)',
                    borderRadius: 'var(--vl-radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--vl-shadow-sm)',
                  }}>
                    {stats.recent_transactions.map((tx, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 1.25rem',
                        borderBottom: i < stats.recent_transactions.length - 1 ? '1px solid var(--vl-border)' : 'none',
                      }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--vl-dark)', fontWeight: 500 }}>{tx.description}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--vl-muted)', marginTop: 2 }}>
                            {new Date(tx.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span style={{
                          fontFamily: 'var(--vl-font-display)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: tx.amount >= 0 ? 'var(--vl-success)' : 'var(--vl-error)',
                        }}>
                          +{tx.amount} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  )
}
