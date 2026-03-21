# V-Link - Implementation Plan

**Date:** 2026-03-21
**Status:** Phase 1 Complete — Planning Phases 2-7
**Stack:** NestJS 10 + TypeORM 0.3.28 + Supabase PostgreSQL | Next.js 16.2 + React 19 + Tailwind CSS 4

---

## Phase Overview

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation (entities, auth, users, frontend shell) | ✅ COMPLETE |
| 2 | Event Management (CRUD + roles + applications) | 🔄 NEXT |
| 3 | Volunteer Matching (FastAPI matching service) | 📋 PLANNED |
| 4 | Gamification (rewards, badges, points, leaderboard) | 📋 PLANNED |
| 5 | Calendar + Notifications (Google Calendar sync, push) | 📋 PLANNED |
| 6 | Social Media Integration (OAuth, share buttons) | 📋 PLANNED |
| 7 | Benefits Marketplace + NFT Diplomas | 📋 PLANNED |

---

## Phase 2 — Event Management (DETAILED)

### Goals
- Organizers create events with multiple roles (e.g., "5 voluntari la intrare, 3 la tehnic")
- Volunteers browse events, view roles, and submit applications
- Organizers manage application statuses (APPROVE / REJECT)
- Full CRUD with owner-only guards on write operations

---

### 2.1 — Backend Dependencies

```bash
cd backend
npm install class-validator class-transformer @nestjs/mapped-types
npm install --save-dev @nestjs/testing jest @types/jest ts-jest supertest @types/supertest
```

Add to `backend/package.json`:
```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

---

### 2.2 — Enable ValidationPipe Globally

**File:** `backend/src/main.ts`

```typescript
import { ValidationPipe } from '@nestjs/common';
// After NestFactory.create:
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

### 2.3 — Events Module (Backend)

**New files:**
- `backend/src/events/dto/create-event.dto.ts`
- `backend/src/events/dto/update-event.dto.ts`
- `backend/src/events/events.service.ts`
- `backend/src/events/events.controller.ts`
- `backend/src/events/events.module.ts`
- `backend/src/events/events.service.spec.ts`

#### `create-event.dto.ts`
```typescript
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsNotEmpty() address: string;
  @IsDateString() start_date: string;
  @IsDateString() end_date: string;
}
```

#### `update-event.dto.ts`
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
export class UpdateEventDto extends PartialType(CreateEventDto) {}
```

#### `events.service.ts` — Key methods
- `create(dto, organizerAuthId)` — lookup User by auth_id, check role===ORGANIZER, save event
- `findAll(page=1, limit=10)` — paginated with `skip/take`, returns `{ data, total }`
- `findOne(id)` — throws `NotFoundException` if missing
- `update(id, dto, requesterAuthId)` — throws `ForbiddenException` if not owner; uses immutable pattern: `Object.assign({}, event, dto)`
- `remove(id, requesterAuthId)` — validates ownership before delete

#### `events.controller.ts` — Endpoints
```
POST   /events              — create (ORGANIZER only)
GET    /events?page=1       — list (public)
GET    /events/:id          — get one (public)
PATCH  /events/:id          — update (owner only)
DELETE /events/:id          — delete (owner only)
```

#### `events.module.ts`
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Event]), UsersModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
```

**Modify:** `backend/src/app.module.ts` — add `EventsModule` to imports.

---

### 2.4 — EventRoles Module (Backend)

**New files:**
- `backend/src/event-roles/dto/create-event-role.dto.ts`
- `backend/src/event-roles/event-roles.service.ts`
- `backend/src/event-roles/event-roles.controller.ts`
- `backend/src/event-roles/event-roles.module.ts`
- `backend/src/event-roles/event-roles.service.spec.ts`

#### `create-event-role.dto.ts`
```typescript
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreateEventRoleDto {
  @IsString() @IsNotEmpty() role_name: string;
  @IsNumber() @Min(1) slots_needed: number;
  @IsArray() @IsOptional() required_skills?: number[];
}
```

#### `event-roles.controller.ts` — Endpoints
```
POST   /events/:id/roles              — create role (organizer only)
GET    /events/:id/roles              — list roles for event (public)
DELETE /events/:eventId/roles/:roleId — delete role (organizer only)
```

**Modify:** `backend/src/app.module.ts` — add `EventRolesModule`.

---

### 2.5 — Applications Module (Backend)

**New files:**
- `backend/src/applications/dto/create-application.dto.ts`
- `backend/src/applications/dto/update-application-status.dto.ts`
- `backend/src/applications/applications.service.ts`
- `backend/src/applications/applications.controller.ts`
- `backend/src/applications/applications.module.ts`
- `backend/src/applications/applications.service.spec.ts`

#### `create-application.dto.ts`
```typescript
import { IsUUID } from 'class-validator';
export class CreateApplicationDto {
  @IsUUID() role_id: string;
}
```

#### `update-application-status.dto.ts`
```typescript
import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';
export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus) status: ApplicationStatus;
}
```

#### `applications.service.ts` — Key methods
- `apply(dto, userAuthId)` — create with PENDING status; catch `23505` DB constraint → throw `ConflictException`
- `findByUser(userAuthId)` — volunteer sees their own applications
- `findByRole(roleId, requesterAuthId)` — organizer sees all applicants for a role
- `updateStatus(appId, dto, requesterAuthId)` — resolve `application → role → event → organizer_id` chain; throw `ForbiddenException` if not owner

#### `applications.controller.ts` — Endpoints
```
POST  /applications                  — apply (VOLUNTEER)
GET   /applications/my               — my applications (VOLUNTEER)
GET   /applications/role/:roleId     — applicants for role (ORGANIZER)
PATCH /applications/:id/status       — approve/reject (ORGANIZER)
```

**Modify:** `backend/src/app.module.ts` — add `ApplicationsModule`.

---

### 2.6 — Users Controller (New Endpoint)

**New file:** `backend/src/users/users.controller.ts`

```typescript
@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(SupabaseGuard)
  async getMe(@Req() req: Request) {
    return this.usersService.findByAuthId(req['user'].id);
  }
}
```

**Modify:** `backend/src/users/users.module.ts` — add `UsersController`.

---

### 2.7 — Frontend Implementation

**New files:**
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/api/events.ts`
- `frontend/src/hooks/useDbUser.ts`
- `frontend/src/components/events/EventCard.tsx`
- `frontend/src/components/events/EventForm.tsx`
- `frontend/src/app/(dashboard)/events/page.tsx`
- `frontend/src/app/(dashboard)/events/create/page.tsx`
- `frontend/src/app/(dashboard)/events/[id]/page.tsx`
- `frontend/src/app/(dashboard)/events/[id]/edit/page.tsx`

**Modified files:**
- `frontend/src/app/(dashboard)/dashboard/page.tsx` — make "Evenimente" card a link to `/events`

#### `frontend/.env.local` — add:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### `client.ts` — API wrapper with Bearer token
```typescript
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...(options.headers ?? {}),
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}
```

#### `useDbUser.ts` — fetch User entity from backend
```typescript
// Calls GET /users/me and returns the User record with role field
// Used for role-gating (ORGANIZER vs VOLUNTEER) in frontend components
```

#### `EventCard.tsx` — Props: `{ event: Event; href: string }`
- Displays: title, date range (Romanian locale), address, truncated description
- Tailwind: white bg, rounded-xl, border, hover:shadow-md (matches dashboard card pattern)

#### `EventForm.tsx` — Props: `{ initial?, onSubmit, loading }`
- Fields (using existing `Input` component): title, description (textarea), address, start_date, end_date (datetime-local)
- Client-side validation: `end_date > start_date` before submit

#### `/events/page.tsx`
- Grid of `EventCard` components
- "Creează eveniment" button visible only for ORGANIZER role
- Pagination: `?page=N` search param

#### `/events/create/page.tsx`
- Role-gate: redirect to `/events` if not ORGANIZER
- On submit: `createEvent()` → `router.push('/events/' + event.id)`
- Inline role-adding form after event creation

#### `/events/[id]/page.tsx`
- Section 1: event header (title, date, address, description)
- Section 2: roles list with "Aplică" button per role (VOLUNTEER view)
- Section 3 (ORGANIZER view): applicants per role with APPROVE/REJECT buttons

#### `/events/[id]/edit/page.tsx`
- Guard: redirect if `event.organizer_id !== dbUser.id`
- Pre-populates `EventForm` with current event data

---

### 2.8 — Tests (TDD — Write First)

#### `events.service.spec.ts`
- `create()` — saves with correct organizer_id; throws ForbiddenException if VOLUNTEER role
- `findAll()` — returns `{ data, total }` paginated
- `findOne()` — throws NotFoundException for missing id
- `update()` — throws ForbiddenException if not owner; returns updated entity
- `remove()` — throws ForbiddenException if not owner; calls delete on success

#### `event-roles.service.spec.ts`
- `createForEvent()` — throws if event not found; throws ForbiddenException if not owner
- `findByEvent()` — returns empty array for event with no roles
- `remove()` — validates ownership through event chain

#### `applications.service.spec.ts`
- `apply()` — creates with PENDING; throws ConflictException on duplicate
- `findByUser()` — returns only requesting user's applications
- `updateStatus()` — only organizer can approve; throws ForbiddenException otherwise

**Coverage target: ≥80%**

---

## Phase 3 — Volunteer Matching (High-Level)

**Goal:** Auto-compute match score between volunteer skills and role requirements via FastAPI.

### Architecture
```
Volunteer applies → NestJS ApplicationsService
                          ↓ HTTP POST
                   FastAPI /match endpoint
                          ↓ returns score 0-100
                   Update Application.match_score
```

### Deliverables
- `fast-services/matching/main.py` — FastAPI on port 8000
- `fast-services/matching/routers/match.py` — Jaccard similarity: `|intersection| / |union| × 100`
- `backend/src/matching/matching.service.ts` — HTTP client via `@nestjs/axios`
- Docker Compose: add FastAPI service
- Frontend: sort applicants by `match_score` in organizer view

### Dependencies
- Backend: `@nestjs/axios`, `axios`
- FastAPI: `fastapi`, `uvicorn`, `pydantic` (Python 3.11+)

---

## Phase 4 — Gamification (High-Level)

**Goal:** Points economy + achievement badges + leaderboard.

### Deliverables
- `backend/src/gamification/gamification.service.ts`:
  - `awardPoints(userId, amount, description)` — creates PointTransaction
  - `checkAndAwardBadges(userId)` — evaluates Badge.action_trigger rules
  - `getLeaderboard(limit=50)` — ranked by total_points
  - `getUserStats(userId)` — hours, points, badges for profile page
- Triggers: application COMPLETED → award points; VolunteerLog created → `hours × 10` points
- Badge triggers: FIRST_EVENT, TEN_HOURS, FIVE_EVENTS
- Frontend: `/rewards` page (badges + points history), `/leaderboard` page (ranked table)

### DB Migrations (run in Supabase SQL Editor)
```sql
ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0;
CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id INT REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);
```

---

## Phase 5 — Calendar + Push Notifications (High-Level)

### Deliverables
- **Google Calendar Sync:** OAuth flow + `addToGoogleCalendar(event)` → Google Calendar API v3
- **Push Notifications:**
  - `backend/src/notifications/notifications.service.ts` — `web-push` npm package
  - `push_subscriptions` table in DB
  - Frontend Service Worker (`frontend/public/sw.js`)
  - Trigger on `Application.status` → APPROVED/REJECTED

### Dependencies
- Backend: `web-push`, `@types/web-push`
- Frontend: Service Worker API (browser-native)
- External: Google Identity Services

---

## Phase 6 — Social Media Integration (High-Level)

### Deliverables
- **OAuth:** Enable Google + GitHub in Supabase Dashboard; add buttons in `login/page.tsx`
- **Social Links:** `PATCH /users/me/social-links` endpoint; `User.social_links` JSONB already exists
- **Share Buttons:** `ShareButtons.tsx` component with Twitter/X, Facebook, LinkedIn links

---

## Phase 7 — Marketplace + NFT Diplomas (High-Level)

### Deliverables
- `backend/src/marketplace/marketplace.service.ts`:
  - `listItems()` — returns MarketplaceItem records
  - `redeem(userId, itemId)` — TypeORM queryRunner transaction: check points → deduct → record
- Frontend: `/marketplace` page with item grid + "Cumpără" button
- **NFT (Optional):** Polygon + Thirdweb SDK; `mintDiploma(userId, eventId)` on activity completion

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| SupabaseGuard provides auth_id only; role checks need DB lookup | Medium | Add `RolesGuard` that fetches User once per request and caches on `req` |
| Unique constraint `[user_id, role_id]` — catch PostgreSQL error 23505 | Medium | Wrap in try/catch, detect error code, throw `ConflictException` |
| FastAPI matching adds latency to apply flow | Low | Make async: save application immediately, score asynchronously |
| `total_points` column needs DB migration before Phase 4 | High | Run ALTER TABLE in Supabase SQL Editor before deploying Phase 4 |
| `useDbUser` hook causing N+1 requests on list pages | Medium | Fetch dbUser at layout level, pass via React context |
| 0% test coverage — no test infrastructure set up | High | Install jest + ts-jest as very first step of Phase 2 |

---

## File Checklist — Phase 2

### Backend (New)
- [ ] `backend/src/events/dto/create-event.dto.ts`
- [ ] `backend/src/events/dto/update-event.dto.ts`
- [ ] `backend/src/events/events.service.ts`
- [ ] `backend/src/events/events.controller.ts`
- [ ] `backend/src/events/events.module.ts`
- [ ] `backend/src/events/events.service.spec.ts`
- [ ] `backend/src/event-roles/dto/create-event-role.dto.ts`
- [ ] `backend/src/event-roles/event-roles.service.ts`
- [ ] `backend/src/event-roles/event-roles.controller.ts`
- [ ] `backend/src/event-roles/event-roles.module.ts`
- [ ] `backend/src/event-roles/event-roles.service.spec.ts`
- [ ] `backend/src/applications/dto/create-application.dto.ts`
- [ ] `backend/src/applications/dto/update-application-status.dto.ts`
- [ ] `backend/src/applications/applications.service.ts`
- [ ] `backend/src/applications/applications.controller.ts`
- [ ] `backend/src/applications/applications.module.ts`
- [ ] `backend/src/applications/applications.service.spec.ts`
- [ ] `backend/src/users/users.controller.ts`

### Backend (Modified)
- [ ] `backend/src/main.ts` — add ValidationPipe
- [ ] `backend/src/app.module.ts` — register EventsModule, EventRolesModule, ApplicationsModule
- [ ] `backend/src/users/users.module.ts` — add UsersController
- [ ] `backend/package.json` — add jest config + install deps

### Frontend (New)
- [ ] `frontend/src/lib/api/client.ts`
- [ ] `frontend/src/lib/api/events.ts`
- [ ] `frontend/src/hooks/useDbUser.ts`
- [ ] `frontend/src/components/events/EventCard.tsx`
- [ ] `frontend/src/components/events/EventForm.tsx`
- [ ] `frontend/src/app/(dashboard)/events/page.tsx`
- [ ] `frontend/src/app/(dashboard)/events/create/page.tsx`
- [ ] `frontend/src/app/(dashboard)/events/[id]/page.tsx`
- [ ] `frontend/src/app/(dashboard)/events/[id]/edit/page.tsx`
- [ ] `frontend/.env.local` — add NEXT_PUBLIC_API_URL

### Frontend (Modified)
- [ ] `frontend/src/app/(dashboard)/dashboard/page.tsx` — link "Evenimente" card to `/events`
