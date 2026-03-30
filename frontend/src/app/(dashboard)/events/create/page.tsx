'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createEvent, type EventRolePayload } from '@/lib/api'

interface RoleForm {
  role_name: string
  description: string
  slots_needed: string
  hours_required: string
  points_reward: string
}

export default function CreateEventPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [roles, setRoles] = useState<RoleForm[]>([
    { role_name: '', description: '', slots_needed: '1', hours_required: '1', points_reward: '0' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const addRole = () =>
    setRoles((prev) => [
      ...prev,
      { role_name: '', description: '', slots_needed: '1', hours_required: '1', points_reward: '0' },
    ])

  const removeRole = (index: number) =>
    setRoles((prev) => prev.filter((_, i) => i !== index))

  const updateRole = (index: number, field: keyof RoleForm, value: string) =>
    setRoles((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const validRoles: EventRolePayload[] = roles
      .filter((r) => r.role_name.trim())
      .map((r) => ({
        role_name: r.role_name.trim(),
        description: r.description.trim() || undefined,
        slots_needed: Math.max(1, parseInt(r.slots_needed, 10) || 1),
        hours_required: Math.max(0, parseInt(r.hours_required, 10) || 0),
        points_reward: Math.max(0, parseInt(r.points_reward, 10) || 0),
      }))

    try {
      const event = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        roles: validRoles,
      })
      router.push(`/events/${event.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la creare')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/events" className="text-blue-600 text-sm hover:underline">
            ← Înapoi la evenimente
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Eveniment nou</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white border rounded-xl p-6">
          <Input
            label="Titlu *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Input
            label="Adresă *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data start *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data sfârșit *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Roluri</label>
              <button
                type="button"
                onClick={addRole}
                className="text-blue-600 text-sm hover:underline"
              >
                + Adaugă rol
              </button>
            </div>
            <div className="space-y-4">
              {roles.map((role, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Rol #{i + 1}</span>
                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRole(i)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Șterge
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Nume rol (ex: Voluntar intrare)"
                    value={role.role_name}
                    onChange={(e) => updateRole(i, 'role_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Descriere scurtă a rolului"
                    value={role.description}
                    onChange={(e) => updateRole(i, 'description', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Locuri disponibile</label>
                      <input
                        type="number"
                        min={1}
                        value={role.slots_needed}
                        onChange={(e) => updateRole(i, 'slots_needed', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ore necesare</label>
                      <input
                        type="number"
                        min={0}
                        value={role.hours_required}
                        onChange={(e) => updateRole(i, 'hours_required', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Puncte recompensă</label>
                      <input
                        type="number"
                        min={0}
                        value={role.points_reward}
                        onChange={(e) => updateRole(i, 'points_reward', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Se creează...' : 'Creează eveniment'}
          </Button>
        </form>
      </main>
    </>
  )
}
