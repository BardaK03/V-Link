'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { user, dbUser, signOut } = useAuth()

  return (
    <nav
      style={{
        background: 'var(--vl-surface)',
        borderBottom: '1px solid var(--vl-border)',
        boxShadow: 'var(--vl-shadow-sm)',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-15 flex items-center justify-between" style={{ height: '60px' }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
          <span
            style={{
              width: 28,
              height: 28,
              background: 'var(--vl-orange)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 150ms ease',
            }}
            className="group-hover:scale-110"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="white" fillOpacity="0.9"/>
              <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="white"/>
            </svg>
          </span>
          <span
            style={{
              fontFamily: 'var(--vl-font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--vl-dark)',
              letterSpacing: '-0.02em',
            }}
          >
            V-Link
          </span>
        </Link>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/feed"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Feed
              </Link>
              <Link
                href="/events"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Evenimente
              </Link>
              <Link
                href="/rewards"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Recompense
              </Link>
              <Link
                href="/marketplace"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Marketplace
              </Link>
              <Link
                href="/calendar"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Calendar
              </Link>
              <Link
                href="/leaderboard"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Clasament
              </Link>
              <Link
                href="/dashboard"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Dashboard
              </Link>
              {dbUser?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--vl-error)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '3px 10px',
                    background: 'var(--vl-error-bg)',
                    borderRadius: 99,
                  }}
                >
                  Admin
                </Link>
              )}
              <Button variant="secondary" size="sm" onClick={signOut}>
                Deconectare
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--vl-muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                className="hover:text-[var(--vl-dark)]"
              >
                Autentificare
              </Link>
              <Link href="/register">
                <Button size="sm">Înregistrare</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
