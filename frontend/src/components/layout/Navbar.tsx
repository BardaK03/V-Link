'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          V-Link
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Button variant="secondary" onClick={signOut} className="text-sm">
                Deconectare
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Autentificare
              </Link>
              <Link href="/register">
                <Button className="text-sm">Înregistrare</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
