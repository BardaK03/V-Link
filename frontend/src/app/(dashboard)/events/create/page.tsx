'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createEvent, getAllSkills, type EventRolePayload } from '@/lib/api'

interface RoleForm {
  role_name: string
  description: string
  slots_needed: string
  hours_required: string
  points_reward: string
  required_skills: number[]
}

const inputStyle = {
  border: '1px solid var(--vl-border)',
  borderRadius: 'var(--vl-radius)',
  color: 'var(--vl-text)',
}

export default function CreateEventPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [roles, setRoles] = useState<RoleForm[]>([
    { role_name: '', description: '', slots_needed: '1', hours_required: '1', points_reward: '0', required_skills: [] },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allSkills, setAllSkills] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    getAllSkills()
      .then(setAllSkills)
      .catch(() => {
        // Skills list is non-critical; silently fail
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const addRole = () =>
    setRoles((prev) => [
      ...prev,
      { role_name: '', description: '', slots_needed: '1', hours_required: '1', points_reward: '0', required_skills: [] },
    ])

  const removeRole = (index: number) =>
    setRoles((prev) => prev.filter((_, i) => i !== index))

  const updateRole = (index: number, field: keyof Omit<RoleForm, 'required_skills'>, value: string) =>
    setRoles((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    )

  const toggleRoleSkill = (roleIndex: number, skillId: number) =>
    setRoles((prev) =>
      prev.map((r, i) => {
        if (i !== roleIndex) return r
        const hasSkill = r.required_skills.includes(skillId)
        return {
          ...r,
          required_skills: hasSkill
            ? r.required_skills.filter((id) => id !== skillId)
            : [...r.required_skills, skillId],
        }
      }),
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const validRoles: EventRolePayload[] = roles
      .filter((r) => r.role_name.trim())
      .map((r) => ({
        role_name: r.role_name.trim(),
        description: r.description.trim() || undefined,
        slots_needed: Math.max(1, parseInt(r.slots_needed, 10) || 1),
        hours_required: Math.max(0, parseInt(r.hours_required, 10) || 0),
        points_reward: Math.max(0, parseInt(r.points_reward, 10) || 0),
        required_skills: r.required_skills,
      }))

    try {
      const event = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        roles: validRoles,
      })
      router.push(`/events/${event.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la creare')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/events" className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Înapoi la evenimente
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>Eveniment nou</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl p-6" style={{ backgroundColor: 'var(--vl-surface)', border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius-lg)' }}>
          <Input
            label="Titlu *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Descriere</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>
          <Input
            label="Adresă *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Data start *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Data sfârșit *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--vl-text)' }}>Roluri</label>
              <button
                type="button"
                onClick={addRole}
                className="text-sm hover:underline"
                style={{ color: 'var(--vl-orange)' }}
              >
                + Adaugă rol
              </button>
            </div>
            <div className="space-y-4">
              {roles.map((role, i) => (
                <div key={i} className="rounded-lg p-4 space-y-3" style={{ border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--vl-text)' }}>Rol #{i + 1}</span>
                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRole(i)}
                        className="text-sm hover:underline"
                        style={{ color: 'var(--vl-error)' }}
                      >
                        Șterge
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Nume rol (ex: Voluntar intrare)"
                    value={role.role_name}
                    onChange={(e) => updateRole(i, 'role_name', e.target.value)}
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="Descriere scurtă a rolului"
                    value={role.description}
                    onChange={(e) => updateRole(i, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--vl-muted)' }}>Locuri disponibile</label>
                      <input
                        type="number"
                        min={1}
                        value={role.slots_needed}
                        onChange={(e) => updateRole(i, 'slots_needed', e.target.value)}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--vl-muted)' }}>Ore necesare</label>
                      <input
                        type="number"
                        min={0}
                        value={role.hours_required}
                        onChange={(e) => updateRole(i, 'hours_required', e.target.value)}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--vl-muted)' }}>Puncte recompensă</label>
                      <input
                        type="number"
                        min={0}
                        value={role.points_reward}
                        onChange={(e) => updateRole(i, 'points_reward', e.target.value)}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  {allSkills.length > 0 && (
                    <div>
                      <label className="block mb-1.5" style={{ color: 'var(--vl-text)', fontSize: '0.75rem' }}>
                        Skill-uri necesare
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allSkills.map((skill) => {
                          const selected = role.required_skills.includes(skill.id)
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => toggleRoleSkill(i, skill.id)}
                              className="px-2 py-1 text-xs rounded-full cursor-pointer"
                              style={{
                                background: selected ? '#FEF0E8' : 'var(--vl-bg)',
                                color: selected ? 'var(--vl-orange)' : 'var(--vl-muted)',
                                border: selected
                                  ? '1px solid var(--vl-orange)'
                                  : '1px solid var(--vl-border)',
                              }}
                            >
                              {skill.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Se creează...' : 'Creează eveniment'}
          </Button>
        </form>
      </main>
    </>
  )
}
