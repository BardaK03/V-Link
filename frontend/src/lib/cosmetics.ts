/**
 * Deterministic cosmetic style/class builder.
 * Maps item slugs to whitelisted CSS class names or style values.
 * NEVER injects arbitrary CSS from the server — only uses local constants.
 */

import type { EquippedCosmetics } from './api'

// ── Name color ────────────────────────────────────────────────────────────────

const NAME_COLOR_MAP: Record<string, string> = {
  'color-orange':  '#FF6B35',
  'color-purple':  '#7C3AED',
  'color-emerald': '#059669',
  'color-crimson': '#DC2626',
  'color-gold':    '#D97706',
}

// ── Name animation classes ─────────────────────────────────────────────────────

const NAME_ANIMATION_CLASSES: Record<string, string> = {
  'anim-pulse':   'vl-anim-pulse',
  'anim-rainbow': 'vl-anim-rainbow',
  'anim-glow':    'vl-anim-glow',
  'anim-shake':   'vl-anim-shake',
  'anim-float':   'vl-anim-float',
}

// ── Avatar frame classes ───────────────────────────────────────────────────────

const FRAME_STYLES: Record<string, { border: string; boxShadow?: string }> = {
  'frame-orange':  { border: '3px solid #FF6B35' },
  'frame-gold':    { border: '3px solid #D97706' },
  'frame-rainbow': { border: '3px solid transparent', boxShadow: '0 0 0 3px #a855f7' },
  'frame-neon':    { border: '3px solid #22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.6)' },
  'frame-fire':    { border: '3px solid #EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' },
}

// ── Glow styles ────────────────────────────────────────────────────────────────

const GLOW_STYLES: Record<string, string> = {
  'glow-orange': '0 0 8px rgba(255,107,53,0.8)',
  'glow-purple': '0 0 8px rgba(124,58,237,0.8)',
  'glow-gold':   '0 0 8px rgba(217,119,6,0.8)',
  'glow-neon':   '0 0 8px rgba(34,197,94,0.8)',
  'glow-white':  '0 0 8px rgba(255,255,255,0.9)',
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface NameStyles {
  color?: string
  animationClass?: string
  textShadow?: string
}

export interface AvatarStyles {
  borderStyle?: React.CSSProperties
}

export function getNameStyles(equipped: EquippedCosmetics | null | undefined): NameStyles {
  if (!equipped) return {}

  const result: NameStyles = {}

  if (equipped.name_color_item) {
    const color = NAME_COLOR_MAP[equipped.name_color_item.slug]
    if (color) result.color = color
  }

  if (equipped.name_animation_item) {
    const cls = NAME_ANIMATION_CLASSES[equipped.name_animation_item.slug]
    if (cls) result.animationClass = cls
  }

  if (equipped.glow_item) {
    const shadow = GLOW_STYLES[equipped.glow_item.slug]
    if (shadow) result.textShadow = shadow
  }

  return result
}

export function getAvatarFrameStyle(
  equipped: EquippedCosmetics | null | undefined,
): React.CSSProperties {
  if (!equipped?.avatar_frame_item) return {}
  const frame = FRAME_STYLES[equipped.avatar_frame_item.slug]
  return frame ?? {}
}
