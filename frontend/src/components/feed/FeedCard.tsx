import Link from 'next/link'
import type { FeedEvent } from '@/lib/api'

interface FeedCardProps {
  event: FeedEvent
}

export function FeedCard({ event }: FeedCardProps) {
  const organizer = event.organizer
  const organizerName =
    organizer.company_name || organizer.display_name || 'Organizator'

  const matchPercent = event.match_score
  const matchColor =
    matchPercent >= 70
      ? 'var(--vl-success)'
      : matchPercent >= 40
      ? 'var(--vl-orange)'
      : 'var(--vl-muted)'

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="rounded-xl p-5 hover:shadow-md transition-all cursor-pointer"
        style={{
          backgroundColor: 'var(--vl-surface)',
          border: '1px solid var(--vl-border)',
          borderRadius: 'var(--vl-radius-lg)',
        }}
      >
        {/* Organizer row */}
        <div className="flex items-center gap-2 mb-3">
          {organizer.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={organizer.avatar_url}
              alt={organizerName}
              className="rounded-full object-cover"
              style={{ width: 28, height: 28, flexShrink: 0 }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                width: 28,
                height: 28,
                background: 'var(--vl-orange)',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {organizerName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-medium" style={{ color: 'var(--vl-orange)' }}>
            {organizerName}
          </span>
        </div>

        {/* Event title + meta */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2
              className="font-semibold text-base leading-snug"
              style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
            >
              {event.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--vl-muted)' }}>
              📍 {event.address}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>
              📅 {new Date(event.start_date).toLocaleDateString('ro-RO')}
              {event.end_date !== event.start_date &&
                ` – ${new Date(event.end_date).toLocaleDateString('ro-RO')}`}
            </p>
          </div>

          {/* Match score badge */}
          <div
            className="flex flex-col items-center gap-0.5 shrink-0"
            style={{ minWidth: 52 }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: matchColor, fontFamily: 'var(--vl-font-display)' }}
            >
              {matchPercent}%
            </span>
            <span className="text-xs" style={{ color: 'var(--vl-muted)' }}>
              potrivire
            </span>
          </div>
        </div>

        {/* Roles */}
        {event.roles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.roles.map((role) => (
              <span
                key={role.id}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--vl-info-bg)',
                  color: 'var(--vl-info)',
                }}
              >
                {role.role_name}
                {role.slots_needed > 0 && (
                  <span style={{ opacity: 0.7 }}> · {role.slots_needed} locuri</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
