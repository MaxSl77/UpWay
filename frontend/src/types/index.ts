// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  plan: 'free' | 'starter' | 'pro'
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ── Player ───────────────────────────────────────────────────────────────────

export type Position = 'forward' | 'defenseman' | 'goaltender'
export type HockeyLevel =
  | 'amateur'
  | 'dyussh'
  | 'sdyushor'
  | 'national'
  | 'professional'
  | 'academy'

export interface PlayerSkills {
  skating:  number // 1-10
  shooting: number
  passing:  number
  fitness:  number
  sense:    number
}

export interface Player {
  id: string
  userId: string
  name: string
  age: number
  heightCm: number
  weightKg: number
  position: Position
  country: string
  city?: string
  team?: string
  hockeySchool?: string
  level: HockeyLevel
  goals: string[]
  skills: PlayerSkills
  createdAt: string
  updatedAt: string
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  contextCard?: string  // RAG context snippet shown under AI message
  createdAt: string
}

// ── Roadmap ──────────────────────────────────────────────────────────────────

export type RoadmapItemStatus = 'done' | 'active' | 'todo'

export interface RoadmapItem {
  id: string
  playerId: string
  phaseNumber: number
  phase: string
  title: string
  description: string
  targetDate?: string
  completedDate?: string
  status: RoadmapItemStatus
  tags: string[]
}

// ── Calendar / Events ────────────────────────────────────────────────────────

export type EventType = 'tournament' | 'camp' | 'tryout' | 'deadline' | 'other'
export type EventStatus = 'upcoming' | 'completed'

export interface CalendarEvent {
  id: string
  playerId: string
  title: string
  type: EventType
  status: EventStatus
  date: string
  notes?: string
}

// ── Opportunity ───────────────────────────────────────────────────────────────

export type OppType = 'camp' | 'tryout' | 'tournament'

export interface Opportunity {
  id: string
  type: OppType
  title: string
  description: string
  location: string
  deadline?: string
  isUrgent: boolean
  tags: string[]
  url?: string
}

// ── Subscription ─────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  priceMonthly: number
  currency: string
  features: string[]
  isCurrent: boolean
}

export interface BillingInfo {
  nextBillingDate?: string
  paymentMethod?: string
  lastInvoiceAmount?: number
}

// ── Dashboard metrics ────────────────────────────────────────────────────────

export interface DashboardMetrics {
  goalProgressPct: number
  goalLabel: string
  monthsRemaining: number
  skatingScore: number
  skatingDelta: number
  goalProbabilityPct: number
  probabilityUpdatedAt: string
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}
