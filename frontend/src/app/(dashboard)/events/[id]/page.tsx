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
  type Event,
} from '@/lib/api'

export default function EventDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState<string | null>(null)
  const [appliedRoles, setAppliedRoles] = useState<Set<string>>(new Set())
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user && id) {
      getEvent(id)
        .then(setEvent)
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, loading, id, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    )
  }

  if (!user || !event) return null

  const isOwner = event.organizer?.id === user.id || event.organizer_id === user.id

  const handleApply = async (roleId: string) => {
    setApplying(roleId)
    setError(null)
    setSuccessMsg(null)
    try {
      await applyToRole(roleId)
      setAppliedRoles((prev) => new Set(prev).add(roleId))
      setSuccessMsg('Aplicație trimisă cu succes!')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare necunoscută')
    } finally {
      setApplying(null)
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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/events" className="text-blue-600 text-sm hover:underline">
            ← Înapoi la evenimente
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{successMsg}</div>
        )}

        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            {isOwner && (
              <div className="flex gap-2 ml-4">
                <Link href={`/events/${id}/edit`}>
                  <Button variant="secondary">Editează</Button>
                </Link>
                <Link href={`/events/${id}/applications`}>
                  <Button variant="secondary">Aplicații</Button>
                </Link>
                <Button variant="secondary" onClick={handleDelete}>
                  Șterge
                </Button>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-gray-600 mt-3">{event.description}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium text-gray-700">Locație:</span> {event.address}
            </div>
            <div>
              <span className="font-medium text-gray-700">Start:</span>{' '}
              {new Date(event.start_date).toLocaleString('ro-RO')}
            </div>
            <div>
              <span className="font-medium text-gray-700">Sfârșit:</span>{' '}
              {new Date(event.end_date).toLocaleString('ro-RO')}
            </div>
            <div>
              <span className="font-medium text-gray-700">Organizator:</span>{' '}
              {event.organizer?.email}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Roluri disponibile</h2>
          {(!event.roles || event.roles.length === 0) ? (
            <p className="text-gray-500 text-sm">Nu există roluri definite pentru acest eveniment.</p>
          ) : (
            <div className="space-y-3">
              {event.roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{role.role_name}</p>
                    <p className="text-sm text-gray-500">{role.slots_needed} locuri disponibile</p>
                  </div>
                  {!isOwner && (
                    <Button
                      onClick={() => handleApply(role.id)}
                      disabled={applying === role.id || appliedRoles.has(role.id)}
                    >
                      {appliedRoles.has(role.id) ? 'Aplicat ✓' : applying === role.id ? 'Se trimite...' : 'Aplică'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
