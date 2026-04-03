'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  getMySkills,
  getAllSkills,
  addSkill,
  removeSkill,
  updateSocialLinks,
  updateProfile,
} from '@/lib/api'
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push'
import { createClient } from '@/lib/supabase/client'

const ROLE_LABELS: Record<string, string> = {
  VOLUNTEER: 'Voluntar',
  ORGANIZER: 'Organizator',
  ADMIN: 'Administrator',
}

const SOCIAL_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
  { key: 'website', label: 'Website personal', placeholder: 'https://...' },
]

export default function ProfilePage() {
  const { user, dbUser, loading, refreshDbUser } = useAuth()
  const router = useRouter()

  const [mySkills, setMySkills] = useState<Array<{ id: number; name: string }>>([])
  const [allSkills, setAllSkills] = useState<Array<{ id: number; name: string }>>([])
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [savingLinks, setSavingLinks] = useState(false)
  const [linksSaved, setLinksSaved] = useState(false)
  const [skillLoading, setSkillLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notifSupported, setNotifSupported] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifError, setNotifError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return }
    if (user) {
      Promise.all([getMySkills(), getAllSkills()])
        .then(([mine, all]) => {
          setMySkills(mine)
          setAllSkills(all)
        })
        .catch((e) => setError(e.message))
    }
  }, [user, loading, router])

  useEffect(() => {
    if (dbUser?.social_links) setSocialLinks(dbUser.social_links)
    if (dbUser) {
      setAvatarUrl((dbUser as unknown as { avatar_url?: string | null }).avatar_url ?? null)
      setDisplayName((dbUser as unknown as { display_name?: string | null }).display_name ?? '')
      setCompanyName((dbUser as unknown as { company_name?: string | null }).company_name ?? '')
    }
  }, [dbUser])

  useEffect(() => {
    async function checkSubscription() {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        setNotifSupported(false)
        return
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        if (!reg) {
          setSubscribed(false)
          return
        }
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      } catch {
        setNotifSupported(false)
      }
    }
    checkSubscription()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Fișierul trebuie să fie mai mic de 5MB')
      return
    }
    setAvatarUploading(true)
    setAvatarError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filename = `${user!.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, file, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename)
      const publicUrl = urlData.publicUrl
      await updateProfile({ avatar_url: publicUrl })
      setAvatarUrl(publicUrl)
      await refreshDbUser()
    } catch (e: unknown) {
      setAvatarError(e instanceof Error ? e.message : 'Eroare la încărcarea pozei')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setError(null)
    try {
      await updateProfile({
        display_name: displayName.trim() || undefined,
        company_name: dbUser?.role === 'ORGANIZER' ? (companyName.trim() || undefined) : undefined,
      })
      await refreshDbUser()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la salvare')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveLinks = async () => {
    setSavingLinks(true)
    setError(null)
    try {
      await updateSocialLinks(socialLinks)
      await refreshDbUser()
      setLinksSaved(true)
      setTimeout(() => setLinksSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la salvare')
    } finally {
      setSavingLinks(false)
    }
  }

  const handleAddSkill = async (skillId: number) => {
    setSkillLoading(skillId)
    setError(null)
    try {
      const updated = await addSkill(skillId)
      setMySkills(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setSkillLoading(null)
    }
  }

  const handleRemoveSkill = async (skillId: number) => {
    setSkillLoading(skillId)
    setError(null)
    try {
      const updated = await removeSkill(skillId)
      setMySkills(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setSkillLoading(null)
    }
  }

  const handleSubscribe = async () => {
    setNotifLoading(true)
    setNotifError(null)
    const ok = await subscribeToPush()
    if (ok) setSubscribed(true)
    else setNotifError('Nu s-au putut activa notificările. Verifică permisiunile browserului.')
    setNotifLoading(false)
  }

  const handleUnsubscribe = async () => {
    setNotifLoading(true)
    setNotifError(null)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
    } catch {
      setNotifError('Eroare la dezactivarea notificărilor.')
    }
    setNotifLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vl-bg)' }}>
        <p style={{ color: 'var(--vl-muted)' }}>Se încarcă...</p>
      </div>
    )
  }

  if (!user) return null

  const mySkillIds = new Set(mySkills.map((s) => s.id))
  const availableSkills = allSkills.filter((s) => !mySkillIds.has(s.id))

  return (
    <>
      <Navbar />
      <main
        className="max-w-2xl mx-auto px-4 py-8"
        style={{ background: 'var(--vl-bg)', minHeight: '100vh' }}
      >
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--vl-orange)' }}>
            ← Dashboard
          </Link>
          <h1
            className="text-2xl font-bold mt-2"
            style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
          >
            Profilul meu
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--vl-error-bg)', color: 'var(--vl-error)' }}>
            {error}
          </div>
        )}

        {/* Avatar */}
        <section
          className="rounded-xl border p-5 mb-6"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <h2 className="font-semibold mb-4" style={{ color: 'var(--vl-dark)' }}>Poza de profil</h2>
          <div className="flex items-center gap-5">
            <div
              className="rounded-full flex items-center justify-center overflow-hidden shrink-0"
              style={{ width: 72, height: 72, background: 'var(--vl-info-bg)', border: '2px solid var(--vl-border)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: '2rem', color: 'var(--vl-muted)' }}>👤</span>
              )}
            </div>
            <div>
              <label
                htmlFor="avatar-upload"
                style={{
                  display: 'inline-block',
                  cursor: avatarUploading ? 'not-allowed' : 'pointer',
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--vl-radius)',
                  border: '1px solid var(--vl-border)',
                  fontSize: '0.875rem',
                  color: 'var(--vl-text)',
                  background: 'var(--vl-bg)',
                }}
              >
                {avatarUploading ? 'Se încarcă...' : 'Schimbă poza'}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
              {avatarError && <p className="mt-1 text-xs" style={{ color: 'var(--vl-error)' }}>{avatarError}</p>}
              <p className="mt-1 text-xs" style={{ color: 'var(--vl-muted)' }}>JPG, PNG sau WebP, max 5MB</p>
            </div>
          </div>
        </section>

        {/* Display name / Company name */}
        <section
          className="rounded-xl border p-5 mb-6"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <h2 className="font-semibold mb-4" style={{ color: 'var(--vl-dark)' }}>Profil public</h2>
          <div className="flex flex-col gap-3">
            <Input
              label="Nume afișat"
              placeholder="Cum vrei să apari pe platformă"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            {dbUser?.role === 'ORGANIZER' && (
              <Input
                label="Numele companiei / organizației"
                placeholder="ex. Asociația pentru Voluntariat Cluj"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="primary" loading={savingProfile} onClick={handleSaveProfile}>
              Salvează profil
            </Button>
            {profileSaved && (
              <span className="text-sm" style={{ color: 'var(--vl-success)' }}>Salvat!</span>
            )}
          </div>
        </section>

        {/* Info card */}
        <section
          className="rounded-xl border p-5 mb-6"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--vl-dark)' }}>Informații cont</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--vl-text)' }}>{user.email}</p>
              {dbUser?.role && (
                <span
                  className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'var(--vl-info-bg)', color: 'var(--vl-info)' }}
                >
                  {ROLE_LABELS[dbUser.role] ?? dbUser.role}
                </span>
              )}
            </div>
            {dbUser && (
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--vl-muted)' }}>Puncte totale</p>
                <p
                  style={{
                    fontFamily: 'var(--vl-font-display)',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: 'var(--vl-orange)',
                    lineHeight: 1,
                  }}
                >
                  {dbUser.total_points}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Social links */}
        <section
          className="rounded-xl border p-5 mb-6"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <h2 className="font-semibold mb-4" style={{ color: 'var(--vl-dark)' }}>Link-uri sociale</h2>
          <div className="flex flex-col gap-3">
            {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                placeholder={placeholder}
                value={socialLinks[key] ?? ''}
                onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="primary" loading={savingLinks} onClick={handleSaveLinks}>
              Salvează link-uri
            </Button>
            {linksSaved && (
              <span className="text-sm" style={{ color: 'var(--vl-success)' }}>Salvat!</span>
            )}
          </div>
        </section>

        {/* Skills */}
        <section
          className="rounded-xl border p-5"
          style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
        >
          <h2 className="font-semibold mb-4" style={{ color: 'var(--vl-dark)' }}>Skill-urile mele</h2>

          {mySkills.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {mySkills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full"
                  style={{ background: 'var(--vl-orange-light)', color: 'var(--vl-orange-hover)', border: '1px solid rgba(232,82,10,0.2)' }}
                >
                  {skill.name}
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    disabled={skillLoading === skill.id}
                    style={{ cursor: 'pointer', fontWeight: 700, lineHeight: 1, color: 'inherit', background: 'none', border: 'none', padding: 0 }}
                  >
                    {skillLoading === skill.id ? '…' : '×'}
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm mb-4" style={{ color: 'var(--vl-muted)' }}>
              Nu ai adăugat încă niciun skill.
            </p>
          )}

          {availableSkills.length > 0 && (
            <>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--vl-muted)' }}>
                Adaugă skill-uri:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => handleAddSkill(skill.id)}
                    disabled={skillLoading === skill.id}
                    className="text-sm px-3 py-1 rounded-full transition-colors"
                    style={{
                      background: 'var(--vl-surface-raised)',
                      color: 'var(--vl-text)',
                      border: '1px solid var(--vl-border)',
                      cursor: 'pointer',
                    }}
                  >
                    {skillLoading === skill.id ? '…' : `+ ${skill.name}`}
                  </button>
                ))}
              </div>
            </>
          )}

          {allSkills.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--vl-muted)' }}>
              Nu există skill-uri configurate în sistem.
            </p>
          )}
        </section>

        {/* Push Notifications */}
        {notifSupported && (
          <section
            className="rounded-xl border p-5 mt-6"
            style={{ background: 'var(--vl-surface)', borderColor: 'var(--vl-border)' }}
          >
            <h2
              className="font-semibold mb-2"
              style={{ fontFamily: 'var(--vl-font-display)', color: 'var(--vl-dark)' }}
            >
              Notificări Push
            </h2>
            <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {subscribed
                ? 'Notificările push sunt active pe acest dispozitiv.'
                : 'Activează notificările pentru a primi actualizări despre aplicații.'}
            </p>
            {notifError && (
              <div
                style={{
                  background: 'var(--vl-error-bg)',
                  color: 'var(--vl-error)',
                  borderRadius: 'var(--vl-radius)',
                  padding: '0.75rem',
                  marginBottom: '0.75rem',
                  fontSize: '0.875rem',
                }}
              >
                {notifError}
              </div>
            )}
            {subscribed ? (
              <Button variant="secondary" size="sm" loading={notifLoading} onClick={handleUnsubscribe}>
                Dezactivează notificările
              </Button>
            ) : (
              <Button variant="primary" size="sm" loading={notifLoading} onClick={handleSubscribe}>
                Activează notificările
              </Button>
            )}
          </section>
        )}
      </main>
    </>
  )
}
