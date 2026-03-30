'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { getEvents, type Event } from '@/lib/api'

export default function EventsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      getEvents()
        .then(setEvents)
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, loading, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    )
  }

  if (!user) return null

  const isOrganizer = user.user_metadata?.role === 'ORGANIZER' || user.app_metadata?.role === 'ORGANIZER'

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Evenimente</h1>
          {isOrganizer && (
            <Link href="/events/create">
              <Button>+ Eveniment nou</Button>
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-16">Nu există evenimente momentan.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg">{event.title}</h2>
                      {event.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{event.description}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-2">📍 {event.address}</p>
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                      {new Date(event.start_date).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                  {event.roles && event.roles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.roles.map((role) => (
                        <span
                          key={role.id}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                        >
                          {role.role_name} ({role.slots_needed} locuri)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
