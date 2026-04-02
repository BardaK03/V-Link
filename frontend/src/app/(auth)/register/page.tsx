'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Parolele nu coincid')
      return
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password)

    if (error) {
      setError(error)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--vl-bg)' }}>
        <div className="w-full max-w-md rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--vl-surface)', borderRadius: 'var(--vl-radius-lg)', boxShadow: 'var(--vl-shadow-sm)', border: '1px solid var(--vl-border)' }}>
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>Verifică-ți emailul!</h2>
          <p className="text-sm" style={{ color: 'var(--vl-text)' }}>
            Am trimis un link de confirmare la <strong>{email}</strong>. Confirmă contul pentru a te autentifica.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            Înapoi la autentificare
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--vl-bg)' }}>
      <div className="w-full max-w-md rounded-xl p-8" style={{ backgroundColor: 'var(--vl-surface)', borderRadius: 'var(--vl-radius-lg)', boxShadow: 'var(--vl-shadow-sm)', border: '1px solid var(--vl-border)' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>Creează cont</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--vl-muted)' }}>Alătură-te comunității V-Link</p>

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
            placeholder="Min. 6 caractere"
            required
          />
          <Input
            label="Confirmă parola"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Înregistrare
          </Button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--vl-text)' }}>
          Ai deja cont?{' '}
          <Link href="/login" className="hover:underline font-medium" style={{ color: 'var(--vl-orange)' }}>
            Autentifică-te
          </Link>
        </p>
      </div>
    </main>
  )
}
