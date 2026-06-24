'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, type UserRole } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'

interface NavCard {
  title: string
  description: string
  icon: string
  href: string
}

const VOLUNTEER_CARDS: NavCard[] = [
  { title: 'Evenimente', description: 'Vizualizează și aplică la evenimente de voluntariat', icon: '📅', href: '/events' },
  { title: 'Aplicațiile mele', description: 'Urmărește statusul aplicațiilor și marchează completate', icon: '📋', href: '/my-applications' },
  { title: 'Recompense', description: 'Badge-urile și punctele tale câștigate', icon: '🏆', href: '/rewards' },
  { title: 'Clasament', description: 'Clasamentul celor mai activi voluntari', icon: '📊', href: '/leaderboard' },
  { title: 'Profil', description: 'Editează skill-urile și link-urile tale sociale', icon: '👤', href: '/profile' },
]

const ORGANIZER_CARDS: NavCard[] = [
  { title: 'Evenimentele mele', description: 'Gestionează evenimentele pe care le organizezi', icon: '📅', href: '/events' },
  { title: 'Creează eveniment', description: 'Adaugă un eveniment nou cu roluri și cerințe', icon: '➕', href: '/events/create' },
  { title: 'Aplicații primite', description: 'Aprobă sau respinge aplicațiile voluntarilor', icon: '📋', href: '/organizer/applications' },
  { title: 'Clasament', description: 'Clasamentul celor mai activi voluntari', icon: '📊', href: '/leaderboard' },
  { title: 'Profil', description: 'Editează profilul și link-urile organizației', icon: '👤', href: '/profile' },
]

const ADMIN_CARDS: NavCard[] = [
  { title: 'Toate evenimentele', description: 'Vizualizează și gestionează toate evenimentele', icon: '📅', href: '/events' },
  { title: 'Creează eveniment', description: 'Adaugă un eveniment nou', icon: '➕', href: '/events/create' },
  { title: 'Toate aplicațiile', description: 'Monitorizează toate aplicațiile din platformă', icon: '📋', href: '/organizer/applications' },
  { title: 'Clasament', description: 'Clasamentul global al voluntarilor', icon: '📊', href: '/leaderboard' },
  { title: 'Recompense', description: 'Statistici puncte și badge-uri', icon: '🏆', href: '/rewards' },
  { title: 'Profil', description: 'Setările contului de administrator', icon: '⚙️', href: '/profile' },
]

const ROLE_LABELS: Record<UserRole, string> = {
  VOLUNTEER: 'Voluntar',
  ORGANIZER: 'Organizator',
  ADMIN: 'Administrator',
}

const ROLE_BADGE_STYLE: Record<UserRole, React.CSSProperties> = {
  VOLUNTEER: { background: 'var(--vl-info-bg)', color: 'var(--vl-info)' },
  ORGANIZER: { background: 'var(--vl-success-bg)', color: 'var(--vl-success)' },
  ADMIN: { background: 'var(--vl-warning-bg)', color: 'var(--vl-warning)' },
}

function cardsForRole(role: UserRole | undefined): NavCard[] {
  if (role === 'ADMIN') return ADMIN_CARDS
  if (role === 'ORGANIZER') return ORGANIZER_CARDS
  return VOLUNTEER_CARDS
}

export default function DashboardPage() {
  const { user, dbUser, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg)' }}>
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user) return null

  const role = dbUser?.role
  const cards = cardsForRole(role)

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8" style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
            >
              Bun venit{dbUser ? '!' : '...'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--vl-muted)' }}>{user.email}</p>
            {role && (
              <span
                className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={ROLE_BADGE_STYLE[role]}
              >
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {dbUser && (
              <div
                className="text-right hidden sm:block"
                style={{ color: 'var(--vl-muted)', fontSize: '0.8rem' }}
              >
                <p>Puncte totale</p>
                <p
                  style={{
                    fontFamily: 'var(--vl-font-display)',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'var(--vl-orange)',
                    lineHeight: 1,
                  }}
                >
                  {dbUser.total_points}
                </p>
              </div>
            )}
            <Button variant="secondary" onClick={signOut}>
              Deconectare
            </Button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="block">
              <div
                className="rounded-xl border p-6 h-full transition-shadow hover:shadow-md cursor-pointer"
                style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--vl-dark)' }}>
                  {card.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--vl-muted)' }}>
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
