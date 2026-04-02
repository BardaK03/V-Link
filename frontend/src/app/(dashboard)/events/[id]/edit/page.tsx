'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getEvent, updateEvent, type Event } from '@/lib/api'

function toLocalDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputStyle = {
  border: '1px solid var(--vl-border)',
  borderRadius: 'var(--vl-radius)',
  color: 'var(--vl-text)',
}

export default function EditEventPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [event, setEvent] = useState<Event | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [fetching, setFetching] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user && id) {
      getEvent(id)
        .then((e) => {
          setEvent(e)
          setTitle(e.title)
          setDescription(e.description ?? '')
          setAddress(e.address)
          setStartDate(toLocalDatetime(e.start_date))
          setEndDate(toLocalDatetime(e.end_date))
        })
        .catch((e) => setError(e.message))
        .finally(() => setFetching(false))
    }
  }, [user, loading, id, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user || !event) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await updateEvent(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      })
      router.push(`/events/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la actualizare')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href={`/events/${id}`} className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Înapoi la eveniment
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>Editează eveniment</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl p-6" style={{ backgroundColor: 'var(--vl-surface)', border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius-lg)' }}>
          <Input
            label="Titlu *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Descriere</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
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
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Data start *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Data sfârșit *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Se salvează...' : 'Salvează modificările'}
          </Button>
        </form>
      </main>
    </>
  )
}
