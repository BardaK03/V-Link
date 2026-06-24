'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  getEvent,
  updateEvent,
  closeEventRegistration,
  openEventRegistration,
  addEventRole,
  deleteEventRole,
  updateEventRole,
  getAllSkills,
  type Event,
  type EventRole,
  type EventRolePayload,
} from '@/lib/api'

function toLocalDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputStyle = {
  border: '1px solid var(--vl-border)',
  borderRadius: 'var(--vl-radius)',
  color: 'var(--vl-text)',
}

interface RoleFormState extends EventRolePayload {
  required_skills: number[]
}

const EMPTY_ROLE_FORM: RoleFormState = {
  role_name: '',
  description: '',
  slots_needed: 1,
  hours_required: 1,
  points_reward: 0,
  required_skills: [],
}

export default function EditEventPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [event, setEvent] = useState<Event | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  const [registrationStatus, setRegistrationStatus] = useState<'OPEN' | 'CLOSED'>('OPEN')
  const [fetching, setFetching] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [closingReg, setClosingReg] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Role management state
  const [roles, setRoles] = useState<EventRole[]>([])
  const [roleForm, setRoleForm] = useState<RoleFormState>(EMPTY_ROLE_FORM)
  const [addingRole, setAddingRole] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)
  const [allSkills, setAllSkills] = useState<Array<{ id: number; name: string }>>([])
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [editingRoleForm, setEditingRoleForm] = useState<RoleFormState>(EMPTY_ROLE_FORM)
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user && id) {
      Promise.all([
        getEvent(id),
        getAllSkills().catch(() => [] as Array<{ id: number; name: string }>),
      ])
        .then(([e, skills]) => {
          setEvent(e)
          setTitle(e.title)
          setDescription(e.description ?? '')
          setAddress(e.address)
          setStartDate(toLocalDatetime(e.start_date))
          setEndDate(toLocalDatetime(e.end_date))
          setRegistrationDeadline(e.registration_deadline ? toLocalDatetime(e.registration_deadline) : '')
          setRegistrationStatus(e.registration_status ?? 'OPEN')
          setRoles(e.roles ?? [])
          setAllSkills(skills)
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Eroare la încărcare'))
        .finally(() => setFetching(false))
    }
  }, [user, loading, id, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user || !event) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await updateEvent(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        registration_deadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : null,
      })
      router.push(`/events/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la actualizare')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleRegistration = async () => {
    setClosingReg(true)
    setError(null)
    try {
      const updated = registrationStatus === 'OPEN'
        ? await closeEventRegistration(id)
        : await openEventRegistration(id)
      setRegistrationStatus(updated.registration_status)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setClosingReg(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    // Optimistic update
    const previous = roles
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
    try {
      await deleteEventRole(id, roleId)
    } catch (e: unknown) {
      // Revert on failure
      setRoles(previous)
      setRoleError(e instanceof Error ? e.message : 'Eroare la ștergere')
    }
  }

  const toggleSkill = (skillId: number) => {
    setRoleForm((prev) => {
      const hasSkill = prev.required_skills.includes(skillId)
      return {
        ...prev,
        required_skills: hasSkill
          ? prev.required_skills.filter((id) => id !== skillId)
          : [...prev.required_skills, skillId],
      }
    })
  }

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setRoleError(null)
    if (!roleForm.role_name.trim()) {
      setRoleError('Numele rolului este obligatoriu')
      return
    }
    setAddingRole(true)
    try {
      const payload: EventRolePayload = {
        role_name: roleForm.role_name.trim(),
        description: roleForm.description?.trim() || undefined,
        slots_needed: roleForm.slots_needed,
        hours_required: roleForm.hours_required,
        points_reward: roleForm.points_reward,
        required_skills: roleForm.required_skills,
      }
      const newRole = await addEventRole(id, payload)
      setRoles((prev) => [...prev, newRole])
      setRoleForm(EMPTY_ROLE_FORM)
    } catch (e: unknown) {
      setRoleError(e instanceof Error ? e.message : 'Eroare la adăugare rol')
    } finally {
      setAddingRole(false)
    }
  }

  const getSkillName = (skillId: number): string => {
    const skill = allSkills.find((s) => s.id === skillId)
    return skill ? skill.name : String(skillId)
  }

  const handleStartEditRole = (role: EventRole) => {
    setEditingRoleId(role.id)
    setEditingRoleForm({
      role_name: role.role_name,
      description: role.description ?? '',
      slots_needed: role.slots_needed,
      hours_required: role.hours_required,
      points_reward: role.points_reward,
      required_skills: role.required_skills ?? [],
    })
  }

  const handleCancelEditRole = () => {
    setEditingRoleId(null)
    setEditingRoleForm(EMPTY_ROLE_FORM)
  }

  const handleSaveEditRole = async (roleId: string) => {
    setRoleError(null)
    if (!editingRoleForm.role_name.trim()) {
      setRoleError('Numele rolului este obligatoriu')
      return
    }
    setSavingRole(true)
    try {
      const updated = await updateEventRole(id, roleId, {
        role_name: editingRoleForm.role_name.trim(),
        description: editingRoleForm.description?.trim() || undefined,
        slots_needed: editingRoleForm.slots_needed,
        hours_required: editingRoleForm.hours_required,
        points_reward: editingRoleForm.points_reward,
        required_skills: editingRoleForm.required_skills,
      })
      setRoles((prev) => prev.map((r) => (r.id === roleId ? updated : r)))
      setEditingRoleId(null)
    } catch (e: unknown) {
      setRoleError(e instanceof Error ? e.message : 'Eroare la salvare')
    } finally {
      setSavingRole(false)
    }
  }

  const toggleEditSkill = (skillId: number) => {
    setEditingRoleForm((prev) => {
      const hasSkill = prev.required_skills.includes(skillId)
      return {
        ...prev,
        required_skills: hasSkill
          ? prev.required_skills.filter((id) => id !== skillId)
          : [...prev.required_skills, skillId],
      }
    })
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href={`/events/${id}`} className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Înapoi la eveniment
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>Editează eveniment</h1>

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
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>
              Deadline înscrieri <span style={{ color: 'var(--vl-muted)', fontWeight: 400 }}>(opțional)</span>
            </label>
            <input
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--vl-bg)', border: '1px solid var(--vl-border)', borderRadius: 'var(--vl-radius)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--vl-text)' }}>Stare înscrieri</p>
              <p className="text-xs mt-0.5" style={{ color: registrationStatus === 'OPEN' ? 'var(--vl-success, #16a34a)' : 'var(--vl-error)' }}>
                {registrationStatus === 'OPEN' ? '● Deschise' : '● Închise'}
              </p>
            </div>
            <button
              type="button"
              disabled={closingReg}
              onClick={handleToggleRegistration}
              className="px-3 py-1.5 text-sm rounded-lg"
              style={{
                background: registrationStatus === 'OPEN' ? 'var(--vl-error-bg)' : 'var(--vl-orange-light)',
                color: registrationStatus === 'OPEN' ? 'var(--vl-error)' : 'var(--vl-orange)',
                border: registrationStatus === 'OPEN' ? '1px solid var(--vl-error)' : '1px solid var(--vl-orange)',
                cursor: closingReg ? 'not-allowed' : 'pointer',
              }}
            >
              {closingReg
                ? 'Se procesează...'
                : registrationStatus === 'OPEN'
                  ? 'Închide acum'
                  : 'Redeschide'}
            </button>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Se salvează...' : 'Salvează modificările'}
          </Button>
        </form>

        {/* Role management section */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>Roluri</h2>

          {/* Existing roles list */}
          {roles.length > 0 && (
            <div className="space-y-3 mb-6">
              {roles.map((role) =>
                editingRoleId === role.id ? (
                  // Inline edit form
                  <div
                    key={role.id}
                    className="p-4 space-y-3"
                    style={{
                      background: 'var(--vl-surface)',
                      border: '1px solid var(--vl-orange)',
                      borderRadius: 'var(--vl-radius)',
                    }}
                  >
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>Editează rol</h4>

                    {roleError && (
                      <div className="p-2 rounded text-sm" style={{ backgroundColor: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
                        {roleError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Nume rol *</label>
                      <input
                        type="text"
                        value={editingRoleForm.role_name}
                        onChange={(e) => setEditingRoleForm((prev) => ({ ...prev, role_name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Descriere</label>
                      <textarea
                        value={editingRoleForm.description ?? ''}
                        onChange={(e) => setEditingRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Locuri</label>
                        <input type="number" min={1} value={editingRoleForm.slots_needed} onChange={(e) => setEditingRoleForm((prev) => ({ ...prev, slots_needed: Math.max(1, Number(e.target.value)) }))} className="w-full px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Ore</label>
                        <input type="number" min={0} value={editingRoleForm.hours_required} onChange={(e) => setEditingRoleForm((prev) => ({ ...prev, hours_required: Math.max(0, Number(e.target.value)) }))} className="w-full px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Puncte</label>
                        <input type="number" min={0} value={editingRoleForm.points_reward} onChange={(e) => setEditingRoleForm((prev) => ({ ...prev, points_reward: Math.max(0, Number(e.target.value)) }))} className="w-full px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                      </div>
                    </div>

                    {allSkills.length > 0 && (
                      <div>
                        <label className="block mb-1.5 text-xs" style={{ color: 'var(--vl-text)' }}>Skill-uri necesare</label>
                        <div className="flex flex-wrap gap-2">
                          {allSkills.map((skill) => {
                            const selected = editingRoleForm.required_skills.includes(skill.id)
                            return (
                              <button key={skill.id} type="button" onClick={() => toggleEditSkill(skill.id)} className="px-2 py-1 text-xs rounded-full cursor-pointer" style={{ background: selected ? 'var(--vl-orange-light)' : 'var(--vl-bg)', color: selected ? 'var(--vl-orange)' : 'var(--vl-muted)', border: selected ? '1px solid var(--vl-orange)' : '1px solid var(--vl-border)' }}>
                                {skill.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" size="sm" disabled={savingRole} onClick={() => handleSaveEditRole(role.id)}>
                        {savingRole ? 'Se salvează...' : 'Salvează'}
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={handleCancelEditRole}>
                        Anulează
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal view
                  <div
                    key={role.id}
                    className="flex items-start justify-between gap-4 p-4"
                    style={{
                      background: 'var(--vl-surface)',
                      border: '1px solid var(--vl-border)',
                      borderRadius: 'var(--vl-radius)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>{role.role_name}</p>
                      {role.description && (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--vl-muted)' }}>{role.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs" style={{ color: 'var(--vl-muted)' }}>
                        <span>{role.slots_needed} locuri</span>
                        <span>{role.hours_required}h necesare</span>
                        <span>{role.points_reward} puncte</span>
                      </div>
                      {role.required_skills && role.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {role.required_skills.map((skillId) => (
                            <span key={skillId} className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--vl-orange-light)', color: 'var(--vl-orange)', border: '1px solid var(--vl-orange)' }}>
                              {getSkillName(skillId)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleStartEditRole(role)}>
                        Editează
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => handleDeleteRole(role.id)}>
                        Șterge
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {roles.length === 0 && (
            <p className="text-sm mb-4" style={{ color: 'var(--vl-muted)' }}>Niciun rol adăugat încă.</p>
          )}

          {/* Add role form */}
          <form
            onSubmit={handleAddRole}
            className="space-y-4 p-4"
            style={{
              background: 'var(--vl-surface)',
              border: '1px solid var(--vl-border)',
              borderRadius: 'var(--vl-radius-lg)',
            }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--vl-dark)' }}>Adaugă rol nou</h3>

            {roleError && (
              <div className="p-2 rounded text-sm" style={{ backgroundColor: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
                {roleError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Nume rol *</label>
              <input
                type="text"
                value={roleForm.role_name}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, role_name: e.target.value }))}
                placeholder="ex. Coordonator logistică"
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Descriere</label>
              <textarea
                value={roleForm.description ?? ''}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Opțional"
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Locuri *</label>
                <input
                  type="number"
                  min={1}
                  value={roleForm.slots_needed}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, slots_needed: Math.max(1, Number(e.target.value)) }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Ore *</label>
                <input
                  type="number"
                  min={0}
                  value={roleForm.hours_required}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, hours_required: Math.max(0, Number(e.target.value)) }))}
                  className="w-full px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--vl-text)' }}>Puncte</label>
                <input
                  type="number"
                  min={0}
                  value={roleForm.points_reward}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, points_reward: Math.max(0, Number(e.target.value)) }))}
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
                    const selected = roleForm.required_skills.includes(skill.id)
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className="px-2 py-1 text-xs rounded-full cursor-pointer"
                        style={{
                          background: selected ? 'var(--vl-orange-light)' : 'var(--vl-bg)',
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

            <Button type="submit" disabled={addingRole}>
              {addingRole ? 'Se adaugă...' : '+ Adaugă rol'}
            </Button>
          </form>
        </section>
      </main>
    </>
  )
}
