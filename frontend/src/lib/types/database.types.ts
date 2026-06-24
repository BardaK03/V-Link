export type UserRole = 'VOLUNTEER' | 'ORGANIZER' | 'ADMIN'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

export interface User {
  id: string
  auth_id: string
  email: string
  role: UserRole
  social_links: Record<string, string>
  created_at: string
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  description: string | null
  address: string
  start_date: string
  end_date: string
  created_at: string
}

export interface EventRole {
  id: string
  event_id: string
  role_name: string
  slots_needed: number
  required_skills: number[] | null
}

export interface Application {
  id: string
  user_id: string
  role_id: string
  match_score: number | null
  status: ApplicationStatus
  created_at: string
}

export interface Skill {
  id: number
  name: string
}

export interface VolunteerLog {
  id: string
  user_id: string
  event_id: string | null
  hours_worked: number
  points_earned: number
  completed_at: string
}

export interface PointTransaction {
  id: string
  user_id: string
  amount: number
  description: string
  created_at: string
}

export interface Badge {
  id: number
  name: string
  description: string
  action_trigger: string
}

export interface MarketplaceItem {
  id: number
  name: string
  point_cost: number
  description: string | null
}
