'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { getMyApplications, type Application } from '@/lib/api'
import { subscribeToPush } from '@/lib/push'

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

import type React from 'react'

export default function MyApplicationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'subscribing' | 'on' | 'off'>('idle')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      getMyApplications()
        .then(setApplications)
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, loading, router])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setNotifStatus(Notification.permission === 'granted' ? 'on' : 'off')
  }, [])

  const handleEnableNotifications = async () => {
    setNotifStatus('subscribing')
    const ok = await subscribeToPush()
    setNotifStatus(ok ? 'on' : 'off')
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg)' }}>
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Dashboard
          </Link>
          <h1
            className="text-2xl font-bold mt-2"
            style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
          >
            Aplicațiile mele
          </h1>
        </div>

        {notifStatus === 'off' && (
          <div
            className="mb-4 p-4 rounded-xl border flex items-center justify-between gap-4"
            style={{ background: 'var(--vl-warning-bg)', borderColor: 'var(--vl-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--vl-warning)' }}>
              Activează notificările push pentru a fi anunțat când aplicația ta e aprobată sau respinsă.
            </p>
            <Button variant="secondary" size="sm" onClick={handleEnableNotifications}>
              Activează
            </Button>
          </div>
        )}

        {notifStatus === 'on' && (
          <div
            className="mb-4 p-3 rounded-xl border text-sm"
            style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)', borderColor: 'var(--vl-border)' }}
          >
            Notificările push sunt active.
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}
          >
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
          >
            <p style={{ color: 'var(--vl-muted)' }}>Nu ai aplicat la niciun eveniment încă.</p>
            <Link href="/events">
              <Button variant="primary" className="mt-4">
                Explorează evenimente
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border p-5"
                style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--vl-dark)' }}>
                      {app.role?.event?.title ?? 'Eveniment necunoscut'}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>
                      Rol: {app.role?.role_name ?? '—'}
                    </p>
                    {app.role?.event?.start_date && (
                      <p className="text-xs mt-1" style={{ color: 'var(--vl-muted)' }}>
                        {new Date(app.role.event.start_date).toLocaleDateString('ro-RO', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={STATUS_STYLE[app.status]}
                    >
                      {STATUS_LABELS[app.status]}
                    </span>


                  </div>
                </div>

                {app.match_score !== null && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--vl-border)' }}>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={
                        app.match_score >= 70
                          ? { background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }
                          : app.match_score >= 40
                          ? { background: 'var(--vl-warning-bg)', color: 'var(--vl-warning)' }
                          : { background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }
                      }
                    >
                      {app.match_score}% potrivire
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
