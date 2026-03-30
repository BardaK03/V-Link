import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Events ────────────────────────────────────────────────────────────────────

export function getEvents() {
  return request<Event[]>('/events')
}

export function getEvent(id: string) {
  return request<Event>(`/events/${id}`)
}

export function createEvent(data: CreateEventPayload) {
  return request<Event>('/events', { method: 'POST', body: JSON.stringify(data) })
}

export function updateEvent(id: string, data: UpdateEventPayload) {
  return request<Event>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteEvent(id: string) {
  return request<void>(`/events/${id}`, { method: 'DELETE' })
}

// ── Event Roles ───────────────────────────────────────────────────────────────

export function addEventRole(eventId: string, data: EventRolePayload) {
  return request<EventRole>(`/events/${eventId}/roles`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteEventRole(eventId: string, roleId: string) {
  return request<void>(`/events/${eventId}/roles/${roleId}`, { method: 'DELETE' })
}

// ── Applications ──────────────────────────────────────────────────────────────

export function applyToRole(roleId: string) {
  return request<Application>('/applications', {
    method: 'POST',
    body: JSON.stringify({ role_id: roleId }),
  })
}

export function getMyApplications() {
  return request<Application[]>('/applications/my')
}

export function getEventApplications(eventId: string) {
  return request<Application[]>(`/events/${eventId}/applications`)
}

export function updateApplicationStatus(
  applicationId: string,
  status: 'APPROVED' | 'REJECTED' | 'COMPLETED',
) {
  return request<Application>(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ── Gamification ───────────────────────────────────────────────────────────────

export function getLeaderboard() {
  return request<LeaderboardEntry[]>('/gamification/leaderboard')
}

export function getMyStats() {
  return request<UserStats>('/gamification/my-stats')
}

export function createVolunteerLog(data: { user_id: string; event_id?: string; hours_worked: number }) {
  return request<VolunteerLogResult>('/volunteer-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EventRole {
  id: string
  event_id: string
  role_name: string
  description: string | null
  slots_needed: number
  hours_required: number
  points_reward: number
  required_skills: number[]
}

export interface Event {
  id: string
  organizer_id: string
  organizer: { id: string; email: string; role: string }
  roles: EventRole[]
  title: string
  description: string | null
  address: string
  start_date: string
  end_date: string
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  role_id: string
  role: EventRole & { event: Event }
  user?: { id: string; email: string }
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  match_score: number | null
  created_at: string
}

export interface CreateEventPayload {
  title: string
  description?: string
  address: string
  start_date: string
  end_date: string
  roles?: EventRolePayload[]
}

export interface UpdateEventPayload {
  title?: string
  description?: string
  address?: string
  start_date?: string
  end_date?: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  email: string
  total_points: number
  badge_count: number
}

export interface UserStats {
  total_points: number
  total_hours: number
  events_completed: number
  badges: Array<{ id: number; name: string; description: string; awarded_at: string }>
  recent_transactions: Array<{ amount: number; description: string; created_at: string }>
}

export interface VolunteerLogResult {
  id: string
  user_id: string
  event_id: string | null
  hours_worked: number
  points_earned: number
  completed_at: string
}

export interface EventRolePayload {
  role_name: string
  description?: string
  slots_needed: number
  hours_required: number
  points_reward: number
  required_skills?: number[]
}
