import { getNameStyles } from '@/lib/cosmetics'
import type { EquippedCosmetics } from '@/lib/api'

interface UserNameProps {
  displayName: string
  equipped?: EquippedCosmetics | null
  className?: string
}

/**
 * Renders a username with equipped cosmetic effects (color, animation, glow).
 * Uses only whitelisted CSS classes and colors — never injects arbitrary CSS.
 */
export function UserName({ displayName, equipped, className }: UserNameProps) {
  const styles = getNameStyles(equipped)

  return (
    <span
      className={[styles.animationClass, className].filter(Boolean).join(' ')}
      style={{
        color: styles.color ?? 'inherit',
        textShadow: styles.textShadow,
      }}
    >
      {displayName}
    </span>
  )
}
