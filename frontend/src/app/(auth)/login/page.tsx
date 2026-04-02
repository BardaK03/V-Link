'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--vl-bg)' }}>
      <div className="w-full max-w-md rounded-xl p-8" style={{ backgroundColor: 'var(--vl-surface)', borderRadius: 'var(--vl-radius-lg)', boxShadow: 'var(--vl-shadow-sm)', border: '1px solid var(--vl-border)' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>Bun venit înapoi</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--vl-muted)' }}>Autentifică-te în contul tău V-Link</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--vl-error-bg)', border: '1px solid var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplu.ro"
            required
          />
          <Input
            label="Parolă"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Autentificare
          </Button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--vl-text)' }}>
          Nu ai cont?{' '}
          <Link href="/register" className="hover:underline font-medium" style={{ color: 'var(--vl-orange)' }}>
            Înregistrează-te
          </Link>
        </p>
      </div>
    </main>
  )
}
