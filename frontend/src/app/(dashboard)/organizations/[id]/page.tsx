'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import {
  getOrganizationProfile,
  getOrganizationEvents,
  getOrganizationReviews,
  getOrganizationReviewsSummary,
  createOrganizationReview,
  getReviewEligibility,
  type OrganizationProfile,
  type OrganizationReview,
  type ReviewsSummary,
  type EligibleEvent,
  type Event,
} from '@/lib/api'

interface StarRatingProps {
  rating: number
  onSelect?: (r: number) => void
}

function StarRating({ rating, onSelect }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onSelect?.(star)}
          style={{
            fontSize: '1.25rem',
            color: star <= rating ? 'var(--vl-orange)' : 'var(--vl-border)',
            background: 'none',
            border: 'none',
            cursor: onSelect ? 'pointer' : 'default',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function getEventStatus(event: Event): { label: string; color: string; bg: string } {
  const now = new Date()
  const start = new Date(event.start_date)
  const end = new Date(event.end_date)
  if (now < start) return { label: 'Viitor', color: 'var(--vl-info)', bg: 'var(--vl-info-bg)' }
  if (now >= start && now <= end) return { label: 'În desfășurare', color: 'var(--vl-success)', bg: 'var(--vl-success-bg, #f0fdf4)' }
  return { label: 'Finalizat', color: 'var(--vl-muted)', bg: 'var(--vl-surface-raised, #f9fafb)' }
}

export default function OrganizationProfilePage() {
  const { user, dbUser, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [profile, setProfile] = useState<OrganizationProfile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [reviews, setReviews] = useState<OrganizationReview[]>([])
  const [summary, setSummary] = useState<ReviewsSummary | null>(null)
  const [eligibleEvents, setEligibleEvents] = useState<EligibleEvent[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewEventId, setReviewEventId] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewPhoto, setReviewPhoto] = useState<File | null>(null)
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState<string | null>(null)
  const [reviewPhotoUploading, setReviewPhotoUploading] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const isVolunteer = dbUser?.role === 'VOLUNTEER'

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user && id) {
      Promise.all([
        getOrganizationProfile(id),
        getOrganizationEvents(id),
        getOrganizationReviews(id),
        getOrganizationReviewsSummary(id),
      ])
        .then(([prof, evts, revs, summ]) => {
          setProfile(prof)
          setEvents(evts)
          setReviews(revs)
          setSummary(summ)
        })
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))

      if (isVolunteer) {
        getReviewEligibility(id)
          .then(setEligibleEvents)
          .catch(() => {})
      }
    }
  }, [user, loading, id, router, isVolunteer])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setReviewError('Fișierul trebuie să fie mai mic de 5MB')
      return
    }
    setReviewPhoto(file)
    setReviewPhotoUploading(true)
    setReviewError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filename = `${user!.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(filename, file, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)
      const { data: urlData } = supabase.storage.from('review-photos').getPublicUrl(filename)
      setReviewPhotoUrl(urlData.publicUrl)
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : 'Eroare la încărcarea pozei')
      setReviewPhoto(null)
    } finally {
      setReviewPhotoUploading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewEventId) { setReviewError('Selectează evenimentul'); return }
    if (reviewRating === 0) { setReviewError('Selectează un rating'); return }
    setSubmittingReview(true)
    setReviewError(null)
    try {
      const newReview = await createOrganizationReview(id, {
        event_id: reviewEventId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        photo_url: reviewPhotoUrl ?? undefined,
      })
      setReviews((prev) => [newReview, ...prev])
      setSummary((prev) => prev ? {
        total: prev.total + 1,
        average_rating: ((prev.average_rating * prev.total) + reviewRating) / (prev.total + 1),
      } : { total: 1, average_rating: reviewRating })
      setEligibleEvents((prev) => prev.filter((ev) => ev.event_id !== reviewEventId))
      setShowReviewForm(false)
      setReviewEventId('')
      setReviewRating(0)
      setReviewComment('')
      setReviewPhoto(null)
      setReviewPhotoUrl(null)
      setReviewSuccess(true)
      setTimeout(() => setReviewSuccess(false), 3000)
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : 'Eroare la trimiterea recenziei')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg)' }}>
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user || !profile) return null

  const displayName = profile.company_name || profile.display_name || profile.email
  const avgRating = summary?.average_rating ?? 0
  const roundedRating = Math.round(avgRating * 10) / 10

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

        {reviewSuccess && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#f0fdf4', color: 'var(--vl-success)' }}>
            Recenzia a fost trimisă cu succes!
          </div>
        )}

        {/* Organization header */}
        <div className="rounded-xl border p-6 mb-6" style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}>
          <div className="flex items-start gap-4">
            <div
              className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{ width: 72, height: 72, background: 'var(--vl-info-bg)', border: '2px solid var(--vl-border)' }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: '2rem', color: 'var(--vl-muted)' }}>🏢</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}>
                {displayName}
              </h1>
              {profile.company_name && profile.display_name && (
                <p className="text-sm" style={{ color: 'var(--vl-muted)' }}>{profile.display_name}</p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--vl-muted)' }}>
                Membru din {new Date(profile.created_at).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' })}
              </p>

              {/* Rating summary */}
              {summary && summary.total > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>
                    {roundedRating}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--vl-muted)' }}>
                    ({summary.total} {summary.total === 1 ? 'recenzie' : 'recenzii'})
                  </span>
                </div>
              )}

              {/* Social links */}
              {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                <div className="flex gap-3 mt-2 flex-wrap">
                  {Object.entries(profile.social_links).map(([key, url]) =>
                    url ? (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline capitalize" style={{ color: 'var(--vl-orange)' }}>
                        {key}
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--vl-dark)' }}>
            Evenimente ({events.length})
          </h2>
          {events.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--vl-muted)' }}>Niciun eveniment creat încă.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const status = getEventStatus(event)
                return (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div
                      className="rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
                      style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--vl-dark)' }}>{event.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>
                            {new Date(event.start_date).toLocaleDateString('ro-RO')} · {event.address}
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}` }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Reviews section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--vl-dark)' }}>
              Recenzii ({reviews.length})
            </h2>
            {isVolunteer && eligibleEvents.length > 0 && !showReviewForm && (
              <Button variant="primary" size="sm" onClick={() => setShowReviewForm(true)}>
                + Lasă recenzie
              </Button>
            )}
          </div>

          {/* Review form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="rounded-xl border p-5 mb-5 space-y-4"
              style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-orange)' }}
            >
              <h3 className="font-semibold" style={{ color: 'var(--vl-dark)' }}>Recenzie nouă</h3>

              {reviewError && (
                <div className="p-2 rounded text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
                  {reviewError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Eveniment *</label>
                <select
                  value={reviewEventId}
                  onChange={(e) => setReviewEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius)', color: 'var(--vl-text)', background: 'var(--vl-bg)' }}
                >
                  <option value="">Selectează evenimentul...</option>
                  {eligibleEvents.map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>{ev.event_title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--vl-text)' }}>Rating *</label>
                <StarRating rating={reviewRating} onSelect={setReviewRating} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Comentariu (opțional)</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Descrie experiența ta..."
                  maxLength={1000}
                  className="w-full px-3 py-2 text-sm resize-none focus:outline-none"
                  style={{ border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius)', color: 'var(--vl-text)', background: 'var(--vl-bg)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Foto (opțional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={reviewPhotoUploading}
                  className="text-sm"
                  style={{ color: 'var(--vl-text)' }}
                />
                {reviewPhotoUploading && <p className="text-xs mt-1" style={{ color: 'var(--vl-muted)' }}>Se încarcă poza...</p>}
                {reviewPhoto && !reviewPhotoUploading && reviewPhotoUrl && (
                  <img src={reviewPhotoUrl} alt="Preview" className="mt-2 rounded-lg object-cover" style={{ width: 80, height: 80 }} />
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" loading={submittingReview}>
                  Trimite recenzia
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowReviewForm(false); setReviewError(null) }}>
                  Anulează
                </Button>
              </div>
            </form>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--vl-muted)' }}>
              {isVolunteer && eligibleEvents.length > 0
                ? 'Fii primul care lasă o recenzie!'
                : 'Nu există recenzii încă.'}
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border p-4"
                  style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ width: 36, height: 36, background: 'var(--vl-info-bg)', border: '1px solid var(--vl-border)' }}
                      >
                        {review.reviewer?.avatar_url ? (
                          <img src={review.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span style={{ fontSize: '1rem', color: 'var(--vl-muted)' }}>👤</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>
                          {review.reviewer?.display_name || review.reviewer?.email}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--vl-muted)' }}>
                          {review.event?.title}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <StarRating rating={review.rating} />
                      <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>
                        {new Date(review.created_at).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm" style={{ color: 'var(--vl-text)' }}>{review.comment}</p>
                  )}
                  {review.photo_url && (
                    <img
                      src={review.photo_url}
                      alt="Foto recenzie"
                      className="mt-3 rounded-lg object-cover"
                      style={{ maxWidth: '100%', maxHeight: 240 }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
