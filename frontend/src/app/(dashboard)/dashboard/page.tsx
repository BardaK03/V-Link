'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'

const placeholderCards = [
  { title: 'Evenimente', description: 'Vizualizează și aplică la evenimente de voluntariat', icon: '📅', href: '/events' },
  { title: 'Rewards', description: 'Badge-urile și punctele tale câștigate', icon: '🏆', href: '/rewards' },
  { title: 'Leaderboard', description: 'Clasamentul celor mai activi voluntari', icon: '📊', href: '/leaderboard' },
  { title: 'Marketplace', description: 'Folosește punctele pentru beneficii exclusive', icon: '🛍️', href: '/marketplace' },
]

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bun venit!</h1>
            <p className="text-gray-500 text-sm mt-1">{user.email}</p>
          </div>
          <Button variant="secondary" onClick={signOut}>
            Deconectare
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {placeholderCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500">{card.description}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
