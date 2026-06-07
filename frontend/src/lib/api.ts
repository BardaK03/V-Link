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

export function completeEvent(id: string) {
  return request<Event>(`/events/${id}/complete`, { method: 'PATCH' })
}

export function closeEventRegistration(id: string) {
  return request<Event>(`/events/${id}/registration/close`, { method: 'PATCH' })
}

export function openEventRegistration(id: string) {
  return request<Event>(`/events/${id}/registration/open`, { method: 'PATCH' })
}

// ── Shifts ────────────────────────────────────────────────────────────────────

export interface ShiftAssignment {
  id: string
  application_id: string
  role_id: string
  user_id: string
  event_id: string
  shift_date: string
  start_time: string
  end_time: string
  hours: number
  google_event_id: string | null
  created_at: string
  user?: { id: string; email: string; display_name: string | null; avatar_url: string | null }
  role?: EventRole
}

export function getEventShifts(eventId: string) {
  return request<ShiftAssignment[]>(`/events/${eventId}/shifts`)
}

export function autoSplitShifts(eventId: string, role_id: string) {
  return request<ShiftAssignment[]>(`/events/${eventId}/shifts/auto-split`, {
    method: 'POST',
    body: JSON.stringify({ role_id }),
  })
}

export function createShift(
  eventId: string,
  data: { application_id: string; shift_date: string; start_time: string; end_time: string; hours: number },
) {
  return request<ShiftAssignment>(`/events/${eventId}/shifts`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateShift(shiftId: string, data: Partial<{ shift_date: string; start_time: string; end_time: string; hours: number }>) {
  return request<ShiftAssignment>(`/shifts/${shiftId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteShift(shiftId: string) {
  return request<void>(`/shifts/${shiftId}`, { method: 'DELETE' })
}

export function getMyShifts(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const q = params.toString()
  return request<ShiftAssignment[]>(`/shifts/mine${q ? `?${q}` : ''}`)
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

export function updateEventRole(eventId: string, roleId: string, data: Partial<EventRolePayload>) {
  return request<EventRole>(`/events/${eventId}/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ── Applications ──────────────────────────────────────────────────────────────

export interface ApplyPayload {
  role_id: string
  motivation_text?: string
  recommendation_text?: string
}

export function applyToRole(payload: ApplyPayload) {
  return request<Application>('/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getMyApplications() {
  return request<Application[]>('/applications/my')
}

export function getEventApplications(eventId: string) {
  return request<Application[]>(`/events/${eventId}/applications`)
}

export function getReceivedApplications() {
  return request<Application[]>('/applications/received')
}

export function getApplication(id: string) {
  return request<Application>(`/applications/${id}`)
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

export function getMyEventApplications(eventId: string) {
  return request<Array<{ id: string; role_id: string; status: string; created_at: string }>>(`/events/${eventId}/my-applications`)
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function getMe() {
  return request<{ id: string; email: string; role: string; total_points: number; social_links: Record<string, string>; display_name: string | null; company_name: string | null; avatar_url: string | null }>('/users/me')
}

export function updateSocialLinks(social_links: Record<string, string>) {
  return request<unknown>('/users/me/social-links', {
    method: 'PATCH',
    body: JSON.stringify({ social_links }),
  })
}

export function updateProfile(data: { display_name?: string; company_name?: string; avatar_url?: string }) {
  return request<unknown>('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function getMySkills() {
  return request<Array<{ id: number; name: string }>>('/users/me/skills')
}

export function addSkill(skill_id: number) {
  return request<Array<{ id: number; name: string }>>('/users/me/skills', {
    method: 'POST',
    body: JSON.stringify({ skill_id }),
  })
}

export function removeSkill(skillId: number) {
  return request<Array<{ id: number; name: string }>>(`/users/me/skills/${skillId}`, {
    method: 'DELETE',
  })
}

export function markApplicationComplete(applicationId: string) {
  return updateApplicationStatus(applicationId, 'COMPLETED')
}

export function getAllSkills() {
  return request<Array<{ id: number; name: string }>>('/skills')
}

export function getOrganizationProfile(orgId: string) {
  return request<OrganizationProfile>(`/users/${orgId}/profile`)
}

export function getOrganizationEvents(orgId: string) {
  return request<Event[]>(`/events/by-organizer/${orgId}`)
}

export function getOrganizationReviews(orgId: string) {
  return request<OrganizationReview[]>(`/organizations/${orgId}/reviews`)
}

export function getOrganizationReviewsSummary(orgId: string) {
  return request<ReviewsSummary>(`/organizations/${orgId}/reviews/summary`)
}

export function createOrganizationReview(orgId: string, data: { event_id: string; rating: number; comment?: string; photo_url?: string }) {
  return request<OrganizationReview>(`/organizations/${orgId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getReviewEligibility(orgId: string) {
  return request<EligibleEvent[]>(`/organizations/${orgId}/reviews/eligibility`)
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEntry {
  id: string
  type: 'shift' | 'event'
  title: string
  date: string
  start_time: string
  end_time: string
  hours: number
  event_id: string
  event_title: string
  role_name?: string
}

export function getMyCalendar(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const q = params.toString()
  return request<CalendarEntry[]>(`/calendar/me${q ? `?${q}` : ''}`)
}

export function getGoogleCalendarStatus() {
  return request<{ connected: boolean }>('/calendar/google/status')
}

export function disconnectGoogleCalendar() {
  return request<{ disconnected: boolean }>('/calendar/google/disconnect', { method: 'DELETE' })
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
  organizer: { id: string; email: string; role: string; display_name: string | null; company_name: string | null; avatar_url: string | null }
  roles: EventRole[]
  title: string
  description: string | null
  address: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  registration_status: 'OPEN' | 'CLOSED'
  registration_deadline: string | null
  created_at: string
}

export interface OrganizationProfile {
  id: string
  email: string
  role: string
  display_name: string | null
  company_name: string | null
  avatar_url: string | null
  social_links: Record<string, string>
  created_at: string
}

export interface OrganizationReview {
  id: string
  reviewer_id: string
  organization_id: string
  event_id: string
  rating: number
  comment: string | null
  photo_url: string | null
  reviewer: { id: string; email: string; display_name: string | null; avatar_url: string | null }
  event: { id: string; title: string }
  created_at: string
}

export interface ReviewsSummary {
  average_rating: number
  total: number
}

export interface EligibleEvent {
  event_id: string
  event_title: string
}

export interface Application {
  id: string
  user_id: string
  role_id: string
  role: EventRole & { event: Event }
  user?: { id: string; email: string; display_name?: string | null; avatar_url?: string | null; social_links?: Record<string, string> }
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  match_score: number | null
  motivation_text: string | null
  recommendation_text: string | null
  created_at: string
}

export interface CreateEventPayload {
  title: string
  description?: string
  address: string
  start_date: string
  end_date: string
  roles?: EventRolePayload[]
  registration_deadline?: string
}

export interface UpdateEventPayload {
  title?: string
  description?: string
  address?: string
  start_date?: string
  end_date?: string
  registration_deadline?: string | null
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

// ── Marketplace ───────────────────────────────────────────────────────────────

export type ItemCategory =
  | 'COSMETIC_NAME_COLOR'
  | 'COSMETIC_NAME_ANIMATION'
  | 'COSMETIC_AVATAR_FRAME'
  | 'COSMETIC_GLOW'
  | 'PERK'

export interface MarketplaceItem {
  id: number
  slug: string
  name: string
  description: string | null
  point_cost: number
  category: ItemCategory
  payload: Record<string, unknown>
  is_active: boolean
  stock: number | null
}

export interface EquippedCosmetics {
  user_id: string
  name_color_item: MarketplaceItem | null
  name_animation_item: MarketplaceItem | null
  avatar_frame_item: MarketplaceItem | null
  glow_item: MarketplaceItem | null
}

export interface InventoryItem {
  id: string
  user_id: string
  item_id: number
  item: MarketplaceItem
  acquired_at: string
  metadata: Record<string, unknown>
}

export interface MarketplacePurchase {
  id: string
  user_id: string
  item_id: number
  item: MarketplaceItem
  point_cost: number
  status: string
  redemption_code: string | null
  created_at: string
}

export function getMarketplaceItems(category?: ItemCategory) {
  const q = category ? `?category=${encodeURIComponent(category)}` : ''
  return request<MarketplaceItem[]>(`/marketplace/items${q}`)
}

export function purchaseItem(item_id: number) {
  return request<MarketplacePurchase>('/marketplace/purchase', {
    method: 'POST',
    body: JSON.stringify({ item_id }),
  })
}

export function getMyInventory() {
  return request<InventoryItem[]>('/marketplace/me/inventory')
}

export function getMyEquipped() {
  return request<EquippedCosmetics | Record<string, never>>('/marketplace/me/equipped')
}

export function equipCosmetics(data: {
  name_color_item_id?: number | null
  name_animation_item_id?: number | null
  avatar_frame_item_id?: number | null
  glow_item_id?: number | null
}) {
  return request<EquippedCosmetics>('/marketplace/me/equip', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ── Feed ──────────────────────────────────────────────────────────────────────

export interface FeedOrganizer {
  id: string
  display_name: string | null
  company_name: string | null
  avatar_url: string | null
}

export interface FeedRole {
  id: string
  role_name: string
  slots_needed: number
  required_skills: number[]
}

export interface FeedEvent {
  id: string
  title: string
  address: string
  start_date: string
  end_date: string
  status: string
  registration_status: string
  match_score: number
  roles: FeedRole[]
  organizer: FeedOrganizer
}

export interface FeedResponse {
  events: FeedEvent[]
  total: number
  page: number
  limit: number
}

export function getFeedRecommendations(page = 1, limit = 10) {
  return request<FeedResponse>(`/feed?page=${page}&limit=${limit}`)
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  applications: {
    total: number
    approved: number
    rejected: number
    pending: number
    completed: number
    approvalRate: number
    rejectionRate: number
    avgMatchScore: number
    byOrganization: Array<{
      orgId: string
      orgName: string
      total: number
      approved: number
      rejected: number
      pending: number
      approvalRate: number
    }>
    monthlyTrend: Array<{ month: string; total: number; approved: number; rejected: number }>
  }
  users: {
    total: number
    volunteers: number
    organizers: number
    admins: number
    newThisMonth: number
    newThisWeek: number
  }
  events: {
    total: number
    active: number
    completed: number
    createdThisMonth: number
    topRoles: Array<{ roleName: string; applicationCount: number; approvedCount: number }>
    topSkills: Array<{ skillName: string; usedInRoles: number; usedInEvents: number }>
    topOrganizations: Array<{
      orgId: string
      orgName: string
      eventsCount: number
      totalApplications: number
      acceptedVolunteers: number
    }>
  }
  marketplace: {
    topProducts: Array<{ name: string; pointCost: number; purchaseCount: number; totalPointsSpent: number }>
    totalPointsSpent: number
    totalPointsEarned: number
    usersWithTransactions: number
  }
  volunteering: {
    topEventsByPoints: Array<{
      eventTitle: string
      eventId: string
      totalPointsAwarded: number
      volunteerCount: number
      avgHours: number
    }>
    totalLogs: number
    totalPointsAwarded: number
    totalHoursVolunteered: number
    uniqueVolunteers: number
  }
  reviews: {
    avgRatingByOrg: Array<{ orgId: string; orgName: string; avgRating: number; reviewCount: number }>
    overallAvgRating: number
    totalReviews: number
    fiveStarCount: number
    fourPlusStarCount: number
  }
  recentActivity: Array<{ type: string; description: string; actor: string; timestamp: string }>
}

export function getAdminStats() {
  return request<AdminStats>('/admin/stats')
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

export interface ChatHistory {
  role: 'user' | 'model'
  parts: string
}

export function sendChatMessage(message: string, history: ChatHistory[]) {
  return request<{ reply: string }>('/chatbot/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  })
}
