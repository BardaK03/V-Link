'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { getApplication, updateApplicationStatus, markApplicationComplete, type Application } from '@/lib/api'

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

const SOCIAL_ICONS: Record<string, string> = {
  linkedin: '💼',
  github: '🐙',
  twitter: '🐦',
  website: '🌐',
}

import type React from 'react'

export default function ApplicationDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [application, setApplication] = useState<Application | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user && id) {
      getApplication(id)
        .then(setApplication)
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, loading, id, router])

  const handleComplete = async () => {
    if (!application) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await markApplicationComplete(application.id)
      setApplication({ ...application, status: updated.status })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setUpdating(false)
    }
  }

  const handleStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!application) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await updateApplicationStatus(application.id, status)
      setApplication({ ...application, status: updated.status })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setUpdating(false)
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

  if (error && !application) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
          <div className="p-4 rounded-xl" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        </main>
      </>
    )
  }

  if (!application) return null

  const volunteer = application.user as (typeof application.user & { social_links?: Record<string, string> }) | undefined
  const event = application.role?.event
  const role = application.role

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--vl-muted)' }}>
          <Link href="/dashboard" className="hover:underline" style={{ color: 'var(--vl-orange)' }}>Dashboard</Link>
          <span>›</span>
          <Link href="/organizer/applications" className="hover:underline" style={{ color: 'var(--vl-orange)' }}>Aplicații primite</Link>
          <span>›</span>
          <span>Detalii</span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        )}

        {/* Status header */}
        <div
          className="rounded-xl border p-5 mb-4 flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--vl-muted)' }}>
              Status aplicație
            </p>
            <span
              className="inline-block text-sm font-semibold px-3 py-1 rounded-full"
              style={STATUS_STYLE[application.status]}
            >
              {STATUS_LABELS[application.status]}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--vl-muted)' }}>Aplicat la</p>
            <p className="text-sm font-medium" style={{ color: 'var(--vl-dark)' }}>
              {new Date(application.created_at).toLocaleDateString('ro-RO', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          {application.match_score !== null && (
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--vl-muted)' }}>Scor potrivire</p>
              <span
                className="inline-block text-sm font-bold px-3 py-1 rounded-full"
                style={
                  application.match_score >= 70
                    ? { background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }
                    : application.match_score >= 40
                    ? { background: 'var(--vl-warning-bg)', color: 'var(--vl-warning)' }
                    : { background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }
                }
              >
                {application.match_score}% potrivire
              </span>
            </div>
          )}
        </div>

        {/* Volunteer card */}
        <section
          className="rounded-xl border p-5 mb-4"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--vl-muted)' }}>
            Voluntar
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: 'var(--vl-orange-light)', color: 'var(--vl-orange)' }}
            >
              {(volunteer?.email?.[0] ?? '?').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--vl-dark)' }}>
                {volunteer?.email ?? 'Necunoscut'}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>Voluntar</p>
            </div>
          </div>

          {/* Social links */}
          {volunteer?.social_links && Object.keys(volunteer.social_links).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(volunteer.social_links)
                .filter(([, url]) => url)
                .map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--vl-surface-raised)', color: 'var(--vl-text)', border: '1px solid var(--vl-border)', textDecoration: 'none' }}
                  >
                    <span>{SOCIAL_ICONS[key] ?? '🔗'}</span>
                    <span className="capitalize">{key}</span>
                  </a>
                ))}
            </div>
          )}
        </section>

        {/* Motivation & Recommendation */}
        {(application.motivation_text || application.recommendation_text) && (
          <section
            className="rounded-xl border p-5 mb-4"
            style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--vl-muted)' }}>
              Motivație & Recomandare
            </h2>
            {application.motivation_text && (
              <div className="mb-4">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--vl-muted)' }}>De ce vrea să aplice</p>
                <p className="text-sm" style={{ color: 'var(--vl-text)' }}>{application.motivation_text}</p>
              </div>
            )}
            {application.recommendation_text && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--vl-muted)' }}>Ce îl recomandă</p>
                <p className="text-sm" style={{ color: 'var(--vl-text)' }}>{application.recommendation_text}</p>
              </div>
            )}
          </section>
        )}

        {/* Event & Role card */}
        <section
          className="rounded-xl border p-5 mb-6"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--vl-muted)' }}>
            Eveniment & Rol
          </h2>
          {event && (
            <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--vl-border)' }}>
              <Link
                href={`/events/${event.id}`}
                className="font-semibold hover:underline"
                style={{ color: 'var(--vl-dark)' }}
              >
                {event.title}
              </Link>
              <div className="flex gap-4 mt-1 text-sm" style={{ color: 'var(--vl-muted)' }}>
                <span>📍 {event.address}</span>
                <span>
                  📅 {new Date(event.start_date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                  {' – '}
                  {new Date(event.end_date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}
          {role && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p style={{ color: 'var(--vl-muted)' }}>Rol</p>
                <p className="font-medium" style={{ color: 'var(--vl-dark)' }}>{role.role_name}</p>
              </div>
              <div>
                <p style={{ color: 'var(--vl-muted)' }}>Ore necesare</p>
                <p className="font-medium" style={{ color: 'var(--vl-dark)' }}>{role.hours_required}h</p>
              </div>
              <div>
                <p style={{ color: 'var(--vl-muted)' }}>Puncte recompensă</p>
                <p className="font-medium" style={{ color: 'var(--vl-orange)' }}>{role.points_reward} pct</p>
              </div>
              <div>
                <p style={{ color: 'var(--vl-muted)' }}>Locuri disponibile</p>
                <p className="font-medium" style={{ color: 'var(--vl-dark)' }}>{role.slots_needed}</p>
              </div>
              {role.description && (
                <div className="col-span-2">
                  <p style={{ color: 'var(--vl-muted)' }}>Descriere rol</p>
                  <p className="mt-0.5" style={{ color: 'var(--vl-text)' }}>{role.description}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Actions */}
        {application.status === 'PENDING' && (
          <div className="flex gap-3">
            <Button variant="primary" loading={updating} onClick={() => handleStatus('APPROVED')}>
              Aprobă aplicația
            </Button>
            <Button variant="secondary" loading={updating} onClick={() => handleStatus('REJECTED')}>
              Respinge
            </Button>
          </div>
        )}

        {application.status === 'APPROVED' && (
          <div className="flex flex-col gap-3">
            <div
              className="p-4 rounded-xl text-sm"
              style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }}
            >
              Aplicație aprobată. Voluntarul a primit notificare.
            </div>
            <Button variant="primary" loading={updating} onClick={handleComplete}>
              Marchează activitate completată
            </Button>
          </div>
        )}

        {application.status === 'REJECTED' && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}
          >
            Aplicație respinsă. Voluntarul a primit notificare.
          </div>
        )}

        {application.status === 'COMPLETED' && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: 'var(--vl-info-bg)', color: 'var(--vl-info)' }}
          >
            Activitate finalizată. Punctele au fost acordate voluntarului.
          </div>
        )}
      </main>
    </>
  )
}
