'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput } from '@fullcalendar/core'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import {
  getMyCalendar,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
  type CalendarEntry,
} from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function toFcEvent(entry: CalendarEntry): EventInput {
  return {
    id: entry.id,
    title: entry.title,
    start: `${entry.date}T${entry.start_time}:00`,
    end: `${entry.date}T${entry.end_time}:00`,
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
  const searchParams = useSearchParams()

  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [fetching, setFetching] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (!user) return

    // Handle Google callback params
    const googleParam = searchParams.get('google')
    if (googleParam === 'connected') setStatusMsg('Google Calendar conectat cu succes!')
    if (googleParam === 'error') setStatusMsg('Eroare la conectarea cu Google Calendar.')

    const load = async () => {
      try {
        const [cal, status] = await Promise.all([
          getMyCalendar(),
          getGoogleCalendarStatus().catch(() => ({ connected: false })),
        ])
        setEntries(cal)
        setGoogleConnected(status.connected)
      } catch {
        // non-blocking
      } finally {
        setFetching(false)
      }
    }

    load()
  }, [user, loading, router, searchParams])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await disconnectGoogleCalendar()
      setGoogleConnected(false)
      setStatusMsg('Google Calendar deconectat.')
    } catch {
      setStatusMsg('Eroare la deconectare.')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleGoogleConnect = () => {
    window.location.href = `${API_URL}/calendar/google/connect`
  }

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
        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
            >
              Calendar
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>
              Turele tale de voluntariat
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {statusMsg && (
              <span
                className="text-sm px-3 py-1.5 rounded-lg"
                style={{
                  background: statusMsg.includes('succes') ? 'rgba(22,163,74,0.1)' : 'var(--vl-warning-bg)',
                  color: statusMsg.includes('succes') ? '#16a34a' : 'var(--vl-warning)',
                }}
              >
                {statusMsg}
              </span>
            )}

            {googleConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg"
                style={{
                  background: 'var(--vl-error-bg)',
                  color: 'var(--vl-error)',
                  border: '1px solid var(--vl-error)',
                  cursor: disconnecting ? 'not-allowed' : 'pointer',
                }}
              >
                {disconnecting ? 'Se deconectează...' : '✕ Deconectează Google Calendar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg"
                style={{
                  background: 'var(--vl-surface)',
                  color: 'var(--vl-text)',
                  border: '1px solid var(--vl-border)',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Conectează Google Calendar
              </button>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--vl-surface)',
            border: '1px solid var(--vl-border)',
            borderRadius: 'var(--vl-radius-lg)',
          }}
        >
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
                if (eventId) {
                  router.push(`/events/${eventId}`)
                }
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
