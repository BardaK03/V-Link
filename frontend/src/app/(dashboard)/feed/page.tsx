'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { FeedCard } from '@/components/feed/FeedCard'
import { FeedSkeleton } from '@/components/feed/FeedSkeleton'
import { getFeedRecommendations, type FeedEvent } from '@/lib/api'

const LIMIT = 10

export default function FeedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [events, setEvents] = useState<FeedEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const res = await getFeedRecommendations(pageNum, LIMIT)
      setEvents((prev) => (append ? [...prev, ...res.events] : res.events))
      setTotal(res.total)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la încărcare')
    }
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      setFetching(true)
      loadPage(1, false).finally(() => setFetching(false))
    }
  }, [user, loading, router, loadPage])

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setLoadingMore(true)
    await loadPage(nextPage, true)
    setPage(nextPage)
    setLoadingMore(false)
  }

  const hasMore = events.length < total

  if (loading || fetching) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <h1
            className="text-2xl font-bold mb-6"
            style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
          >
            Feed recomandat
          </h1>
          <FeedSkeleton />
        </main>
      </>
    )
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
          >
            Feed recomandat
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--vl-muted)' }}>
            Oportunități de voluntariat personalizate pentru tine
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}
          >
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl"
            style={{
              backgroundColor: 'var(--vl-surface)',
              border: '1px solid var(--vl-border)',
            }}
          >
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium" style={{ color: 'var(--vl-dark)' }}>
              Nicio oportunitate momentan
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--vl-muted)' }}>
              Adaugă skill-uri în profilul tău pentru recomandări mai bune
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {events.map((event) => (
                <FeedCard key={event.id} event={event} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 rounded-lg text-sm font-medium transition-opacity"
                  style={{
                    backgroundColor: 'var(--vl-surface)',
                    border: '1px solid var(--vl-border)',
                    color: 'var(--vl-dark)',
                    opacity: loadingMore ? 0.6 : 1,
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingMore ? 'Se încarcă...' : `Încarcă mai multe (${total - events.length} rămase)`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
