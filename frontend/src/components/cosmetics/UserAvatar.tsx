import { getAvatarFrameStyle } from '@/lib/cosmetics'
import type { EquippedCosmetics } from '@/lib/api'

interface UserAvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  equipped?: EquippedCosmetics | null
  size?: number   // px
  className?: string
}

/**
 * Renders a user avatar with an optional equipped frame overlay.
 */
export function UserAvatar({
  avatarUrl,
  displayName,
  equipped,
  size = 40,
  className,
}: UserAvatarProps) {
  const frameStyle = getAvatarFrameStyle(equipped)
  const initial = (displayName?.[0] ?? '?').toUpperCase()

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...frameStyle,
  }

  return (
    <div style={containerStyle} className={className}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName ?? 'Avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'var(--vl-orange-light)',
            color: 'var(--vl-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: size * 0.4,
          }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}
