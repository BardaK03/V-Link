'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import {
  getEvent,
  getEventShifts,
  autoSplitShifts,
  updateShift,
  deleteShift,
  getEventApplications,
  type Event,
  type EventRole,
  type ShiftAssignment,
  type Application,
} from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

interface DayColumn {
  date: string       // YYYY-MM-DD
  label: string      // "Lun 07 Apr"
  shifts: ShiftAssignment[]
}

// ── Volunteer chip (draggable) ────────────────────────────────────────────────

function VolunteerChip({
  shift,
  onDelete,
}: {
  shift: ShiftAssignment
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: shift.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const name =
    shift.user?.display_name ??
    shift.user?.email?.split('@')[0] ??
    shift.user_id.slice(0, 8)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none"
      title={`${shift.start_time}–${shift.end_time} · ${shift.hours}h`}
      data-no-dnd="false"
      aria-roledescription="Draggable volunteer chip"
    >
      <div className="flex items-center gap-2 min-w-0">
        {shift.user?.avatar_url ? (
          <img
            src={shift.user.avatar_url}
            alt={name}
            className="w-6 h-6 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--vl-orange-light)', color: 'var(--vl-orange)' }}
          >
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--vl-dark)' }}>
            {name}
          </p>
          <p className="text-xs" style={{ color: 'var(--vl-muted)' }}>
            {shift.hours}h · {shift.start_time}–{shift.end_time}
          </p>
        </div>
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(shift.id)}
        className="text-xs shrink-0 hover:opacity-70"
        style={{ color: 'var(--vl-error)' }}
        aria-label="Remove shift"
      >
        ✕
      </button>
    </div>
  )
}

// ── Day column (droppable) ─────────────────────────────────────────────────────

function DayColumn({
  col,
  onDelete,
}: {
  col: DayColumn
  onDelete: (id: string) => void
}) {
  const totalHours = col.shifts.reduce((s, sh) => s + Number(sh.hours), 0)

  return (
    <div
      className="flex flex-col rounded-xl p-3 min-h-40"
      style={{
        background: 'var(--vl-surface)',
        border: '1px solid var(--vl-border)',
        borderRadius: 'var(--vl-radius-lg)',
        minWidth: 200,
        flex: '0 0 220px',
      }}
      data-column-date={col.date}
    >
      <div className="mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>
          {col.label}
        </p>
        <p className="text-xs" style={{ color: 'var(--vl-muted)' }}>
          {totalHours > 0 ? `${totalHours}h total` : 'Nicio tură'}
        </p>
      </div>

      <SortableContext
        items={col.shifts.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1">
          {col.shifts.map((shift) => (
            <VolunteerChip key={shift.id} shift={shift} onDelete={onDelete} />
          ))}
          {col.shifts.length === 0 && (
            <div
              className="flex-1 flex items-center justify-center rounded-lg text-xs"
              style={{
                border: '2px dashed var(--vl-border)',
                borderRadius: 'var(--vl-radius)',
                color: 'var(--vl-muted)',
                minHeight: 60,
              }}
            >
              Trage voluntari aici
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id: eventId } = useParams<{ id: string }>()

  const [event, setEvent] = useState<Event | null>(null)
  const [shifts, setShifts] = useState<ShiftAssignment[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [splitting, setSplitting] = useState<string | null>(null) // role_id being split
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const load = useCallback(async () => {
    if (!eventId) return
    try {
      const [ev, sh, apps] = await Promise.all([
        getEvent(eventId),
        getEventShifts(eventId),
        getEventApplications(eventId),
      ])
      setEvent(ev)
      setShifts(sh)
      setApplications(apps)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la încărcare')
    } finally {
      setFetching(false)
    }
  }, [eventId])

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user) load()
  }, [user, loading, load, router])

  // Build day columns from event dates
  const getDays = (): DayColumn[] => {
    if (!event) return []
    const days: DayColumn[] = []
    const cur = new Date(event.start_date)
    const last = new Date(event.end_date)
    cur.setUTCHours(0, 0, 0, 0)
    last.setUTCHours(0, 0, 0, 0)

    while (cur <= last) {
      const dateStr = cur.toISOString().slice(0, 10)
      const label = cur.toLocaleDateString('ro-RO', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
      days.push({
        date: dateStr,
        label,
        shifts: shifts.filter((s) => s.shift_date === dateStr),
      })
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    return days
  }

  const days = getDays()

  const handleAutoSplit = async (role: EventRole) => {
    setSplitting(role.id)
    setError(null)
    try {
      const updated = await autoSplitShifts(eventId, role.id)
      setShifts(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la auto-split')
    } finally {
      setSplitting(null)
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId))
    try {
      await deleteShift(shiftId)
    } catch {
      await load()
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // handled on dragEnd
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find the shift being dragged
    const dragged = shifts.find((s) => s.id === active.id)
    if (!dragged) return

    // Determine target column date from the over element
    // over.id may be a shift.id in a column, or a column date directly
    const targetShift = shifts.find((s) => s.id === over.id)
    const targetDate = targetShift
      ? targetShift.shift_date
      : String(over.id) // dragged onto empty column area

    if (targetDate === dragged.shift_date) return

    // Optimistic update
    setShifts((prev) =>
      prev.map((s) =>
        s.id === dragged.id ? { ...s, shift_date: targetDate } : s,
      ),
    )

    try {
      await updateShift(dragged.id, { shift_date: targetDate })
    } catch {
      await load()
    }
  }

  const activeShift = activeId ? shifts.find((s) => s.id === activeId) : null

  const approvedApps = applications.filter((a) => a.status === 'APPROVED')
  const uniqueRoles = event?.roles ?? []

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg)' }}>
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user || !event) return null

  return (
    <>
      <Navbar />
      <main className="px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <Link
                href={`/events/${eventId}/applications`}
                className="text-sm hover:underline"
                style={{ color: 'var(--vl-orange)' }}
              >
                ← Înapoi la aplicații
              </Link>
              <h1
                className="text-2xl font-bold mt-1"
                style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
              >
                Planificare ture — {event.title}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>
                {approvedApps.length} voluntari aprobați · {days.length} zi{days.length !== 1 ? 'le' : ''}
              </p>
            </div>

            {/* Auto-split buttons per role */}
            <div className="flex flex-wrap gap-2">
              {uniqueRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  disabled={splitting === role.id}
                  onClick={() => handleAutoSplit(role)}
                  className="px-3 py-1.5 text-sm rounded-lg"
                  style={{
                    background: 'var(--vl-orange-light)',
                    color: 'var(--vl-orange)',
                    border: '1px solid var(--vl-orange)',
                    cursor: splitting === role.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {splitting === role.id
                    ? 'Se procesează...'
                    : `Auto-split: ${role.role_name}`}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}
            >
              {error}
            </div>
          )}

          {days.length === 0 && (
            <p style={{ color: 'var(--vl-muted)' }}>Evenimentul nu are zile definite.</p>
          )}

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {days.map((col) => (
                <DayColumn key={col.date} col={col} onDelete={handleDeleteShift} />
              ))}
            </div>

            <DragOverlay>
              {activeShift && (
                <div
                  className="px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
                  style={{ background: 'var(--vl-surface)', border: '1px solid var(--vl-orange)', color: 'var(--vl-dark)' }}
                >
                  {activeShift.user?.display_name ??
                    activeShift.user?.email?.split('@')[0] ??
                    activeShift.user_id.slice(0, 8)}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Legend */}
          <div className="mt-8 p-4 rounded-xl" style={{ background: 'var(--vl-surface)', border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius-lg)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--vl-dark)' }}>
              Voluntari aprobați fără tură asignată
            </h2>
            {approvedApps.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--vl-muted)' }}>Niciun voluntar aprobat.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {approvedApps.map((app) => {
                  const hasShift = shifts.some((s) => s.application_id === app.id)
                  if (hasShift) return null
                  const name =
                    app.user?.display_name ??
                    app.user?.email?.split('@')[0] ??
                    app.user_id.slice(0, 8) ??
                    '?'
                  const roleName = app.role?.role_name ?? ''
                  return (
                    <span
                      key={app.id}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        background: 'var(--vl-bg)',
                        border: '1px solid var(--vl-border)',
                        color: 'var(--vl-text)',
                      }}
                    >
                      {name} · {roleName}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
