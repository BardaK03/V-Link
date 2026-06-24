'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import {
  getMyInventory,
  getMyEquipped,
  equipCosmetics,
  type InventoryItem,
  type EquippedCosmetics,
} from '@/lib/api'

const EQUIP_SLOT_LABELS: Record<string, string> = {
  COSMETIC_NAME_COLOR: 'Culoare nume',
  COSMETIC_NAME_ANIMATION: 'Animație nume',
  COSMETIC_AVATAR_FRAME: 'Frame avatar',
  COSMETIC_GLOW: 'Aură',
}

function categoryToSlot(
  category: string,
): keyof Pick<EquippedCosmetics, 'name_color_item' | 'name_animation_item' | 'avatar_frame_item' | 'glow_item'> | null {
  const map: Record<string, 'name_color_item' | 'name_animation_item' | 'avatar_frame_item' | 'glow_item'> = {
    COSMETIC_NAME_COLOR: 'name_color_item',
    COSMETIC_NAME_ANIMATION: 'name_animation_item',
    COSMETIC_AVATAR_FRAME: 'avatar_frame_item',
    COSMETIC_GLOW: 'glow_item',
  }
  return map[category] ?? null
}

export default function InventoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [equipped, setEquipped] = useState<EquippedCosmetics | null>(null)
  const [fetching, setFetching] = useState(true)
  const [equipping, setEquipping] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user) {
      Promise.all([
        getMyInventory(),
        getMyEquipped().catch(() => null),
      ])
        .then(([inv, eq]) => {
          setInventory(inv)
          if (eq && 'user_id' in eq) setEquipped(eq as EquippedCosmetics)
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Eroare'))
        .finally(() => setFetching(false))
    }
  }, [user, loading, router])

  const cosmeticItems = inventory.filter((i) => i.item.category !== 'PERK')
  const perkItems = inventory.filter((i) => i.item.category === 'PERK')

  const isEquipped = (itemId: number): boolean => {
    if (!equipped) return false
    return (
      equipped.name_color_item?.id === itemId ||
      equipped.name_animation_item?.id === itemId ||
      equipped.avatar_frame_item?.id === itemId ||
      equipped.glow_item?.id === itemId
    )
  }

  const handleEquip = async (item: InventoryItem) => {
    const slot = categoryToSlot(item.item.category)
    if (!slot) return

    setEquipping(item.item.id)
    setError(null)
    setSuccessMsg(null)
    try {
      const slotKeyMap: Record<
        'name_color_item' | 'name_animation_item' | 'avatar_frame_item' | 'glow_item',
        'name_color_item_id' | 'name_animation_item_id' | 'avatar_frame_item_id' | 'glow_item_id'
      > = {
        name_color_item: 'name_color_item_id',
        name_animation_item: 'name_animation_item_id',
        avatar_frame_item: 'avatar_frame_item_id',
        glow_item: 'glow_item_id',
      }

      const alreadyOn = isEquipped(item.item.id)
      const payload = { [slotKeyMap[slot]]: alreadyOn ? null : item.item.id }

      const updated = await equipCosmetics(payload)
      setEquipped(updated)
      setSuccessMsg(alreadyOn ? 'Dezechipat.' : `"${item.item.name}" echipat!`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setEquipping(null)
    }
  }

  if (loading || fetching) {
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
      <main className="max-w-4xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        <div className="mb-6">
          <Link href="/marketplace" className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Marketplace
          </Link>
          <h1
            className="text-2xl font-bold mt-1"
            style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
          >
            Inventar
          </h1>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }}>
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        )}

        {/* Cosmetics */}
        {cosmeticItems.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--vl-dark)' }}>
              Cosmetice
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cosmeticItems.map((inv) => {
                const on = isEquipped(inv.item.id)
                const slotLabel = EQUIP_SLOT_LABELS[inv.item.category] ?? ''
                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl flex flex-col gap-2"
                    style={{
                      background: on ? 'var(--vl-orange-light)' : 'var(--vl-surface)',
                      border: on ? '1px solid var(--vl-orange)' : '1px solid var(--vl-border)',
                      borderRadius: 'var(--vl-radius-lg)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>
                        {inv.item.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--vl-muted)' }}>{slotLabel}</p>
                      {inv.item.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>
                          {inv.item.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={equipping === inv.item.id}
                      onClick={() => handleEquip(inv)}
                      className="px-3 py-1.5 text-xs rounded-lg mt-auto"
                      style={{
                        background: on ? 'var(--vl-orange)' : 'var(--vl-bg)',
                        color: on ? '#fff' : 'var(--vl-text)',
                        border: '1px solid var(--vl-border)',
                        cursor: equipping === inv.item.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {equipping === inv.item.id
                        ? 'Se procesează...'
                        : on
                          ? '✓ Echipat — Dezechipează'
                          : 'Echipează'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Perks */}
        {perkItems.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--vl-dark)' }}>
              Beneficii / Voucher-e
            </h2>
            <div className="space-y-3">
              {perkItems.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl flex items-center justify-between gap-4"
                  style={{ background: 'var(--vl-surface)', border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius-lg)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>🎁 {inv.item.name}</p>
                    {inv.item.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>{inv.item.description}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'var(--vl-muted)' }}>
                      Obținut: {new Date(inv.acquired_at).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                  {inv.metadata?.redemption_code != null && (
                    <div
                      className="px-3 py-1.5 rounded-lg text-sm font-mono font-bold select-all"
                      style={{ background: 'var(--vl-orange-light)', color: 'var(--vl-orange)', border: '1px solid var(--vl-orange)' }}
                    >
                      {String(inv.metadata.redemption_code)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {inventory.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--vl-muted)' }}>
            <p className="text-sm">Inventarul tău este gol.</p>
            <Link href="/marketplace" className="text-sm hover:underline mt-2 inline-block" style={{ color: 'var(--vl-orange)' }}>
              Explorează Marketplace →
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
