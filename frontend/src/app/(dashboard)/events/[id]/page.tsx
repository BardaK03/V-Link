'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import {
  getEvent,
  applyToRole,
  deleteEvent,
  getAllSkills,
  getMyEventApplications,
  type Event,
  type EventRole,
} from '@/lib/api'

export default function EventDetailPage() {
  const { user, dbUser, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [event, setEvent] = useState<Event | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appliedRoles, setAppliedRoles] = useState<Set<string>>(new Set())
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [allSkills, setAllSkills] = useState<Array<{ id: number; name: string }>>([])

  // Modal state
  const [applyRole, setApplyRole] = useState<EventRole | null>(null)
  const [motivationText, setMotivationText] = useState('')
  const [recommendationText, setRecommendationText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user && id) {
      Promise.all([
        getEvent(id),
        getAllSkills(),
        getMyEventApplications(id).catch(() => [] as Array<{ id: string; role_id: string; status: string; created_at: string }>),
      ])
        .then(([evt, skills, myApps]) => {
          setEvent(evt)
          setAllSkills(skills)
          const appliedIds = new Set(myApps.map((a) => a.role_id))
          setAppliedRoles(appliedIds)
        })
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

  if (!user || !event) return null

  const isOwner = event.organizer?.id === user.id || event.organizer_id === user.id
  const isVolunteer = !isOwner && dbUser?.role !== 'ADMIN'

  const getSkillName = (id: number) => allSkills.find(s => s.id === id)?.name ?? `Skill ${id}`

  const openApplyModal = (role: EventRole) => {
    setApplyRole(role)
    setMotivationText('')
    setRecommendationText('')
    setError(null)
  }

  const handleSubmitApply = async () => {
    if (!applyRole) return
    setSubmitting(true)
    setError(null)
    try {
      await applyToRole({
        role_id: applyRole.id,
        motivation_text: motivationText.trim() || undefined,
        recommendation_text: recommendationText.trim() || undefined,
      })
      setAppliedRoles((prev) => new Set(prev).add(applyRole.id))
      setSuccessMsg(`Aplicație trimisă pentru rolul "${applyRole.role_name}"!`)
      setApplyRole(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare necunoscută')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Ești sigur că vrei să ștergi acest eveniment?')) return
    try {
      await deleteEvent(id)
      router.push('/events')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la ștergere')
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        <div className="mb-4">
          <Link href="/events" className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Înapoi la evenimente
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }}>
            {successMsg}
          </div>
        )}

        {/* Event card */}
        <div className="rounded-xl border p-6 mb-6" style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
            >
              {event.title}
            </h1>
            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <Link href={`/events/${id}/edit`}>
                  <Button variant="secondary" size="sm">Editează</Button>
                </Link>
                <Link href={`/events/${id}/applications`}>
                  <Button variant="secondary" size="sm">Aplicații</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={handleDelete}>
                  Șterge
                </Button>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-3 text-sm" style={{ color: 'var(--vl-text)' }}>{event.description}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm" style={{ color: 'var(--vl-muted)' }}>
            <div><span style={{ color: 'var(--vl-dark)', fontWeight: 500 }}>Locație:</span> {event.address}</div>
            <div>
              <span style={{ color: 'var(--vl-dark)', fontWeight: 500 }}>Start:</span>{' '}
              {new Date(event.start_date).toLocaleString('ro-RO')}
            </div>
            <div>
              <span style={{ color: 'var(--vl-dark)', fontWeight: 500 }}>Sfârșit:</span>{' '}
              {new Date(event.end_date).toLocaleString('ro-RO')}
            </div>
            <div>
              <span style={{ color: 'var(--vl-dark)', fontWeight: 500 }}>Organizator:</span>{' '}
              <Link href={`/organizations/${event.organizer?.id}`} style={{ color: 'var(--vl-orange)', textDecoration: 'underline' }}>
                {event.organizer?.company_name || event.organizer?.display_name || event.organizer?.email}
              </Link>
            </div>
          </div>
        </div>

        {/* Roles */}
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--vl-dark)' }}>
          Roluri disponibile
        </h2>
        {(!event.roles || event.roles.length === 0) ? (
          <p className="text-sm" style={{ color: 'var(--vl-muted)' }}>Nu există roluri definite pentru acest eveniment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {event.roles.map((role) => (
              <div
                key={role.id}
                className="rounded-xl border p-4"
                style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--vl-dark)' }}>{role.role_name}</p>
                    {role.description && (
                      <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>{role.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm" style={{ color: 'var(--vl-muted)' }}>
                      <span>👥 {role.slots_needed} locuri</span>
                      <span>⏱ {role.hours_required}h</span>
                      <span
                        className="font-semibold"
                        style={{ color: 'var(--vl-orange)' }}
                      >
                        🏆 {role.points_reward} puncte
                      </span>
                    </div>
                    {role.required_skills && role.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.required_skills.map((skillId) => (
                          <span
                            key={skillId}
                            style={{
                              background: 'var(--vl-orange-light)',
                              color: 'var(--vl-orange)',
                              border: '1px solid var(--vl-orange)',
                              borderRadius: 'var(--vl-radius)',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              fontWeight: 500,
                            }}
                          >
                            {getSkillName(skillId)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isVolunteer && (
                    <Button
                      variant={appliedRoles.has(role.id) ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={appliedRoles.has(role.id)}
                      onClick={() => openApplyModal(role)}
                    >
                      {appliedRoles.has(role.id) ? 'Aplicat ✓' : 'Aplică'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Apply modal */}
      {applyRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setApplyRole(null) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: 'var(--vl-surface)', boxShadow: 'var(--vl-shadow-lg)' }}
          >
            <h2
              className="text-xl font-bold mb-1"
              style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
            >
              Aplică pentru "{applyRole.role_name}"
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--vl-muted)' }}>
              🏆 {applyRole.points_reward} puncte · ⏱ {applyRole.hours_required}h
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--vl-dark)' }}>
                De ce vrei să aplici? <span style={{ color: 'var(--vl-muted)', fontWeight: 400 }}>(opțional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Descrie motivația ta pentru acest rol..."
                value={motivationText}
                onChange={(e) => setMotivationText(e.target.value)}
                maxLength={1000}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{
                  border: '1px solid var(--vl-border)',
                  outline: 'none',
                  color: 'var(--vl-text)',
                  background: 'var(--vl-bg)',
                }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: 'var(--vl-muted)' }}>
                {motivationText.length}/1000
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--vl-dark)' }}>
                Ce te recomandă? <span style={{ color: 'var(--vl-muted)', fontWeight: 400 }}>(opțional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Experiență relevantă, skill-uri, proiecte anterioare..."
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
                maxLength={1000}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{
                  border: '1px solid var(--vl-border)',
                  outline: 'none',
                  color: 'var(--vl-text)',
                  background: 'var(--vl-bg)',
                }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: 'var(--vl-muted)' }}>
                {recommendationText.length}/1000
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" loading={submitting} onClick={handleSubmitApply}>
                Trimite aplicația
              </Button>
              <Button variant="secondary" onClick={() => setApplyRole(null)}>
                Anulează
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
