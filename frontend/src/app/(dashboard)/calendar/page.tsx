'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput } from '@fullcalendar/core'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { getMyCalendar, type CalendarEntry } from '@/lib/api'

// Build a valid ISO datetime from a date and a HH:MM or HH:MM:SS time.
// Tolerating both shapes guards against a stray HH:MM:SS producing an
// invalid `...T09:00:00:00` string that FullCalendar would silently drop.
function toIso(date: string, time: string): string {
  return `${date}T${time.slice(0, 5)}:00`
}

function toFcEvent(entry: CalendarEntry): EventInput {
  return {
    id: entry.id,
    title: entry.title,
    start: toIso(entry.date, entry.start_time),
    end: toIso(entry.date, entry.end_time),
    extendedProps: {
      event_id: entry.event_id,
      role_name: entry.role_name,
      hours: entry.hours,
    },
    backgroundColor: 'var(--vl-orange)',
    borderColor: 'var(--vl-orange)',
    textColor: '#fff',
  }
}

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (!user) return

    getMyCalendar()
      .then((data) => { setEntries(data); setError(null) })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Eroare la încărcarea calendarului'),
      )
      .finally(() => setFetching(false))
  }, [user, loading, router])

  const fcEvents = entries.map(toFcEvent)

  if (loading) {
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
      <main className="max-w-6xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Dashboard
          </Link>
          <h1
            className="text-2xl font-bold mt-2"
            style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
          >
            Calendar
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>
            Turele tale de voluntariat
          </p>
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--vl-surface)',
            border: '1px solid var(--vl-border)',
            borderRadius: 'var(--vl-radius-lg)',
          }}
        >
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}
            >
              {error}
            </div>
          )}
          {fetching ? (
            <div className="flex items-center justify-center h-64">
              <p style={{ color: 'var(--vl-muted)' }}>Se încarcă calendarul...</p>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              locale="ro"
              buttonText={{
                today: 'Azi',
                month: 'Lună',
                week: 'Săptămână',
                day: 'Zi',
              }}
              events={fcEvents}
              height="auto"
              eventClick={(info) => {
                const eventId = info.event.extendedProps.event_id
                if (eventId) router.push(`/events/${eventId}`)
              }}
              eventContent={(arg) => (
                <div className="px-1 py-0.5 text-xs truncate">
                  <strong>{arg.event.title}</strong>
                  {arg.event.extendedProps.hours && (
                    <span style={{ opacity: 0.8 }}> · {arg.event.extendedProps.hours}h</span>
                  )}
                </div>
              )}
            />
          )}
        </div>
      </main>
    </>
  )
}
