'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import {
  getMarketplaceItems,
  getMyInventory,
  purchaseItem,
  type MarketplaceItem,
  type ItemCategory,
} from '@/lib/api'

const CATEGORIES: { key: ItemCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Toate' },
  { key: 'COSMETIC_NAME_COLOR', label: 'Culori nume' },
  { key: 'COSMETIC_NAME_ANIMATION', label: 'Animații' },
  { key: 'COSMETIC_AVATAR_FRAME', label: 'Frame avatar' },
  { key: 'COSMETIC_GLOW', label: 'Aură' },
  { key: 'PERK', label: 'Beneficii' },
]

const CATEGORY_ICONS: Record<string, string> = {
  COSMETIC_NAME_COLOR: '🎨',
  COSMETIC_NAME_ANIMATION: '✨',
  COSMETIC_AVATAR_FRAME: '🖼️',
  COSMETIC_GLOW: '💫',
  PERK: '🎁',
}

function ItemCard({
  item,
  userPoints,
  owned,
  onBuy,
  buying,
}: {
  item: MarketplaceItem
  userPoints: number
  owned: boolean
  onBuy: (item: MarketplaceItem) => void
  buying: number | null
}) {
  const canAfford = userPoints >= item.point_cost
  const isOutOfStock = item.stock !== null && item.stock <= 0
  const canBuy = !owned && canAfford && !isOutOfStock

  return (
    <div
      className="flex flex-col rounded-xl p-4 gap-3"
      style={{
        background: owned ? 'var(--vl-success-bg)' : 'var(--vl-surface)',
        border: owned ? '1px solid var(--vl-success)' : '1px solid var(--vl-border)',
        borderRadius: 'var(--vl-radius-lg)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xl">{CATEGORY_ICONS[item.category] ?? '⭐'}</span>
          <h3 className="text-sm font-semibold mt-1" style={{ color: 'var(--vl-dark)' }}>
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--vl-muted)' }}>
              {item.description}
            </p>
          )}
        </div>
        {owned ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)', border: '1px solid var(--vl-success)' }}
          >
            ✓ Deținut
          </span>
        ) : item.stock !== null ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isOutOfStock ? 'var(--vl-error-bg)' : 'var(--vl-success-bg)',
              color: isOutOfStock ? 'var(--vl-error)' : 'var(--vl-success)',
            }}
          >
            {isOutOfStock ? 'Epuizat' : `${item.stock} rămase`}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div
          className="px-3 py-1 rounded-full text-sm font-bold"
          style={{
            background: canAfford && !owned ? 'var(--vl-orange-light)' : 'var(--vl-bg)',
            color: canAfford && !owned ? 'var(--vl-orange)' : 'var(--vl-muted)',
          }}
        >
          {item.point_cost} puncte
        </div>
        <button
          type="button"
          disabled={!canBuy || buying === item.id}
          onClick={() => onBuy(item)}
          className="px-3 py-1.5 text-sm rounded-lg"
          style={{
            background: canBuy ? 'var(--vl-orange)' : 'var(--vl-border)',
            color: canBuy ? '#fff' : 'var(--vl-muted)',
            cursor: canBuy ? 'pointer' : 'not-allowed',
          }}
        >
          {buying === item.id ? 'Se cumpără...' : owned ? 'Deținut' : 'Cumpără'}
        </button>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const { user, dbUser, loading, refreshDbUser } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [ownedItemIds, setOwnedItemIds] = useState<Set<number>>(new Set())
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'ALL'>('ALL')
  const [fetching, setFetching] = useState(true)
  const [buying, setBuying] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user) {
      Promise.all([getMarketplaceItems(), getMyInventory()])
        .then(([allItems, inventory]) => {
          setItems(allItems)
          setOwnedItemIds(new Set(inventory.map((inv) => inv.item_id)))
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Eroare'))
        .finally(() => setFetching(false))
    }
  }, [user, loading, router])

  const filteredItems =
    activeCategory === 'ALL'
      ? items
      : items.filter((i) => i.category === activeCategory)

  const handleBuy = async (item: MarketplaceItem) => {
    if (!confirm(`Cumperi "${item.name}" pentru ${item.point_cost} puncte?`)) return
    setBuying(item.id)
    setError(null)
    setSuccessMsg(null)
    try {
      const purchase = await purchaseItem(item.id)
      setOwnedItemIds((prev) => new Set([...prev, item.id]))
      setSuccessMsg(
        purchase.redemption_code
          ? `Cumpărat! Codul tău: ${purchase.redemption_code}`
          : `"${item.name}" adăugat în inventar!`,
      )
      await refreshDbUser?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la cumpărare')
    } finally {
      setBuying(null)
    }
  }

  const userPoints = dbUser?.total_points ?? 0

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
      <main className="max-w-5xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}
            >
              Marketplace
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>
              Folosește punctele tale pentru recompense exclusive
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'var(--vl-orange-light)', color: 'var(--vl-orange)', border: '1px solid var(--vl-orange)' }}
            >
              {userPoints} puncte
            </div>
            <Link
              href="/marketplace/inventory"
              className="px-3 py-2 text-sm rounded-xl"
              style={{ background: 'var(--vl-surface)', border: '1px solid var(--vl-border)', color: 'var(--vl-text)' }}
            >
              Inventar →
            </Link>
          </div>
        </div>

        {successMsg && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'var(--vl-success-bg)', color: 'var(--vl-success)' }}
          >
            {successMsg}
          </div>
        )}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}
          >
            {error}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className="px-3 py-1.5 text-sm rounded-full"
              style={{
                background: activeCategory === cat.key ? 'var(--vl-orange)' : 'var(--vl-surface)',
                color: activeCategory === cat.key ? '#fff' : 'var(--vl-text)',
                border: activeCategory === cat.key
                  ? '1px solid var(--vl-orange)'
                  : '1px solid var(--vl-border)',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="text-center py-12" style={{ color: 'var(--vl-muted)' }}>Se încarcă...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--vl-muted)' }}>Niciun item disponibil.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                userPoints={userPoints}
                owned={ownedItemIds.has(item.id)}
                onBuy={handleBuy}
                buying={buying}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
