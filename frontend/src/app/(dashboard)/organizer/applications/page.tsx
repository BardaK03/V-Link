'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { getReceivedApplications, updateApplicationStatus, type Application } from '@/lib/api'

const STATUS_LABELS: Record<Application['status'], string> = {
  PENDING: 'În așteptare',
  APPROVED: 'Aprobat',
  REJECTED: 'Respins',
  COMPLETED: 'Finalizat',
}

const STATUS_STYLE: Record<Application['status'], React.CSSProperties> = {
  PENDING: { background: 'var(--vl-warning-bg)', color: 'var(--vl-warning)' },
  APPROVED: { background: 'var(--vl-success-bg)', color: 'var(--vl-success)' },
  REJECTED: { background: 'var(--vl-error-bg)', color: 'var(--vl-error)' },
  COMPLETED: { background: 'var(--vl-info-bg)', color: 'var(--vl-info)' },
}

type FilterStatus = 'ALL' | Application['status']

import type React from 'react'

export default function ReceivedApplicationsPage() {
  const { user, dbUser, loading } = useAuth()
  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (!loading && dbUser && dbUser.role === 'VOLUNTEER') { router.push('/dashboard'); return }
    if (user) {
      getReceivedApplications()
        .then(setApplications)
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, dbUser, loading, router])

  const handleStatus = async (appId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdating(appId)
    setError(null)
    try {
      const updated = await updateApplicationStatus(appId, status)
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: updated.status } : a)),
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setUpdating(null)
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg)' }}>
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user) return null

  const filtered = filter === 'ALL' ? applications : applications.filter((a) => a.status === filter)

  // Group by event
  const byEvent = filtered.reduce<Record<string, { title: string; apps: Application[] }>>((acc, app) => {
    const eventId = app.role?.event?.id ?? 'unknown'
    const title = app.role?.event?.title ?? 'Eveniment necunoscut'
    const existing = acc[eventId] ?? { title, apps: [] }
    return { ...acc, [eventId]: { ...existing, apps: [...existing.apps, app] } }
  }, {})

  const counts: Record<FilterStatus, number> = {
    ALL: applications.length,
    PENDING: applications.filter((a) => a.status === 'PENDING').length,
    APPROVED: applications.filter((a) => a.status === 'APPROVED').length,
    REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
    COMPLETED: applications.filter((a) => a.status === 'COMPLETED').length,
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Dashboard
          </Link>
          <h1
            className="text-2xl font-bold mt-2"
            style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
          >
            Aplicații primite
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--vl-muted)' }}>
            Toate aplicațiile voluntarilor pentru evenimentele tale
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={
                filter === s
                  ? { background: 'var(--vl-orange)', color: '#fff' }
                  : { background: 'var(--vl-surface)', color: 'var(--vl-muted)', border: '1px solid var(--vl-border)' }
              }
            >
              {s === 'ALL' ? 'Toate' : STATUS_LABELS[s]} ({counts[s]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
          >
            <p style={{ color: 'var(--vl-muted)' }}>
              {applications.length === 0
                ? 'Nu ai primit nicio aplicație încă.'
                : 'Nicio aplicație cu statusul selectat.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(byEvent).map(([eventId, { title, apps }]) => (
              <div key={eventId}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--vl-muted)' }}>
                    {title} — {apps.length} aplicaț{apps.length === 1 ? 'ie' : 'ii'}
                  </h2>
                  <Link
                    href={`/events/${eventId}/applications`}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--vl-orange)' }}
                  >
                    Vezi pe eveniment →
                  </Link>
                </div>

                <div className="flex flex-col gap-2">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl border p-4 flex items-center gap-4"
                      style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
                    >
                      {/* Avatar placeholder */}
                      <div
                        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'var(--vl-orange-light)', color: 'var(--vl-orange)' }}
                      >
                        {(app.user?.email?.[0] ?? '?').toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--vl-dark)' }}>
                          {app.user?.email ?? 'Utilizator necunoscut'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>
                          Rol: {app.role?.role_name ?? '—'} · {new Date(app.created_at).toLocaleDateString('ro-RO')}
                        </p>
                      </div>

                      {/* Match score */}
                      {app.match_score !== null && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={
                            app.match_score >= 70
                              ? { background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }
                              : app.match_score >= 40
                              ? { background: 'var(--vl-warning-bg)', color: 'var(--vl-warning)' }
                              : { background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }
                          }
                        >
                          {app.match_score}%
                        </span>
                      )}

                      {/* Status */}
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={STATUS_STYLE[app.status]}
                      >
                        {STATUS_LABELS[app.status]}
                      </span>

                      {/* Quick actions */}
                      {app.status === 'PENDING' && (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleStatus(app.id, 'APPROVED')}
                            disabled={updating === app.id}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)', cursor: 'pointer' }}
                          >
                            {updating === app.id ? '…' : 'Aprobă'}
                          </button>
                          <button
                            onClick={() => handleStatus(app.id, 'REJECTED')}
                            disabled={updating === app.id}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)', cursor: 'pointer' }}
                          >
                            Respinge
                          </button>
                        </div>
                      )}

                      {/* Detail link */}
                      <Link
                        href={`/organizer/applications/${app.id}`}
                        className="text-xs shrink-0 hover:underline"
                        style={{ color: 'var(--vl-orange)' }}
                      >
                        Detalii →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
