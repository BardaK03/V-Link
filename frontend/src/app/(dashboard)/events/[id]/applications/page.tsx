'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import {
  getEventApplications,
  updateApplicationStatus,
  type Application,
} from '@/lib/api'

const STATUS_LABELS: Record<Application['status'], string> = {
  PENDING: 'În așteptare',
  APPROVED: 'Aprobat',
  REJECTED: 'Respins',
  COMPLETED: 'Finalizat',
}

const STATUS_COLORS: Record<Application['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-500'
  if (score >= 70) return 'bg-green-100 text-green-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Scor N/A'
  return `${score}% potrivire`
}

export default function EventApplicationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [applications, setApplications] = useState<Application[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user && id) {
      getEventApplications(id)
        .then(setApplications)
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

  // Grupează pe roluri și sortează descrescător după match_score
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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href={`/events/${id}`} className="text-blue-600 text-sm hover:underline">
            ← Înapoi la eveniment
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Aplicații ({applications.length})
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {applications.length === 0 ? (
          <p className="text-gray-500 text-center py-16">Nu există aplicații încă.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(sortedGrouped).map(([roleName, apps]) => (
              <div key={roleName}>
                <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                  {roleName} — {apps.length} aplicaț{apps.length === 1 ? 'ie' : 'ii'}
                </h2>
                <div className="space-y-2">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {app.user?.email ?? 'Utilizator necunoscut'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(app.created_at).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${scoreColor(app.match_score)}`}
                        >
                          {scoreLabel(app.match_score)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[app.status]}`}
                        >
                          {STATUS_LABELS[app.status]}
                        </span>
                        {app.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => handleStatus(app.id, 'APPROVED')}
                              disabled={updating === app.id}
                            >
                              Aprobă
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleStatus(app.id, 'REJECTED')}
                              disabled={updating === app.id}
                            >
                              Respinge
                            </Button>
                          </>
                        )}
                      </div>
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
