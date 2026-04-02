'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  getEventApplications,
  updateApplicationStatus,
  createVolunteerLog,
  type Application,
} from '@/lib/api'

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

function scoreStyle(score: number | null): React.CSSProperties {
  if (score === null) return { background: 'var(--vl-surface-raised)', color: 'var(--vl-muted)' }
  if (score >= 70) return { background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }
  if (score >= 40) return { background: 'var(--vl-warning-bg)', color: 'var(--vl-warning)' }
  return { background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }
}

import type React from 'react'

export default function EventApplicationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [applications, setApplications] = useState<Application[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Volunteer log modal state
  const [logApp, setLogApp] = useState<Application | null>(null)
  const [hoursInput, setHoursInput] = useState('')
  const [loggingHours, setLoggingHours] = useState(false)
  const [logSuccess, setLogSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user && id) {
      getEventApplications(id)
        .then(setApplications)
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, loading, id, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg)' }}>
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user) return null

  const handleStatus = async (applicationId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdating(applicationId)
    setError(null)
    try {
      const updated = await updateApplicationStatus(applicationId, status)
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: updated.status } : a)),
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la actualizare')
    } finally {
      setUpdating(null)
    }
  }

  const handleLogHours = async () => {
    if (!logApp) return
    const hours = parseFloat(hoursInput)
    if (!hours || hours <= 0) { setError('Introdu un număr valid de ore'); return }
    setLoggingHours(true)
    setError(null)
    try {
      await createVolunteerLog({
        user_id: logApp.user_id,
        event_id: id,
        hours_worked: hours,
      })
      setLogSuccess(`${hours}h logate pentru ${logApp.user?.email ?? 'voluntar'}`)
      setLogApp(null)
      setHoursInput('')
      setTimeout(() => setLogSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la logare')
    } finally {
      setLoggingHours(false)
    }
  }

  // Group by role, sort by match_score desc
  const grouped = applications.reduce<Record<string, Application[]>>((acc, app) => {
    const key = app.role?.role_name ?? 'Rol necunoscut'
    return { ...acc, [key]: [...(acc[key] ?? []), app] }
  }, {})

  const sortedGrouped = Object.fromEntries(
    Object.entries(grouped).map(([role, apps]) => [
      role,
      [...apps].sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1)),
    ]),
  )

  return (
    <>
      <Navbar />
      <main
        className="max-w-3xl mx-auto px-4 py-8"
        style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}
      >
        <div className="mb-4">
          <Link href={`/events/${id}`} className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Înapoi la eveniment
          </Link>
        </div>

        <h1
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
        >
          Aplicații ({applications.length})
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        )}
        {logSuccess && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }}>
            {logSuccess}
          </div>
        )}

        {applications.length === 0 ? (
          <p className="text-center py-16" style={{ color: 'var(--vl-muted)' }}>Nu există aplicații încă.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(sortedGrouped).map(([roleName, apps]) => (
              <div key={roleName}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--vl-muted)' }}>
                  {roleName} — {apps.length} aplicaț{apps.length === 1 ? 'ie' : 'ii'}
                </h2>
                <div className="flex flex-col gap-2">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-lg border p-4 flex items-center justify-between gap-3 flex-wrap"
                      style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--vl-dark)' }}>
                          {app.user?.email ?? 'Utilizator necunoscut'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>
                          {new Date(app.created_at).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={scoreStyle(app.match_score)}>
                          {app.match_score !== null ? `${app.match_score}%` : 'N/A'}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={STATUS_STYLE[app.status]}>
                          {STATUS_LABELS[app.status]}
                        </span>
                        {app.status === 'PENDING' && (
                          <>
                            <Button size="sm" onClick={() => handleStatus(app.id, 'APPROVED')} loading={updating === app.id}>
                              Aprobă
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleStatus(app.id, 'REJECTED')} loading={updating === app.id}>
                              Respinge
                            </Button>
                          </>
                        )}
                        {app.status === 'COMPLETED' && (
                          <Button size="sm" variant="secondary" onClick={() => { setLogApp(app); setHoursInput('') }}>
                            Loghează ore
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Log hours modal */}
        {logApp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setLogApp(null) }}
          >
            <div
              className="w-full max-w-sm rounded-xl p-6"
              style={{ background: 'var(--vl-surface)', boxShadow: 'var(--vl-shadow-lg)' }}
            >
              <h3
                className="font-semibold text-lg mb-1"
                style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
              >
                Loghează ore voluntariat
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--vl-muted)' }}>
                Voluntar: <strong>{logApp.user?.email}</strong>
              </p>
              <Input
                label="Ore lucrate"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="ex: 4"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button variant="primary" loading={loggingHours} onClick={handleLogHours}>
                  Salvează
                </Button>
                <Button variant="secondary" onClick={() => setLogApp(null)}>
                  Anulează
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
