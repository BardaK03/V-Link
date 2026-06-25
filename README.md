# V-Link

A volunteering platform that connects volunteers with organizers. Volunteers
discover events, apply to roles, get matched by skills, log hours, earn points
and badges, and spend points in a cosmetics/perks marketplace. Organizers create
events, manage roles and shifts, and review volunteers.

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, FullCalendar, dnd-kit |
| **Backend**  | NestJS 10, TypeORM 0.3, PostgreSQL (`pg`) |
| **Auth**     | Supabase Auth |
| **Database** | Supabase-hosted PostgreSQL |
| **Email**    | Resend |
| **Push**     | Web Push (VAPID) |
| **Chatbot**  | Azure OpenAI |

```
V-Link/
├── backend/    # NestJS API (default port 3000)
├── frontend/   # Next.js app (default port 3001)
└── sql/        # database schema + seed and how to apply it
```

---

## Prerequisites

- **Node.js 20+** and npm
- A **Supabase** project (free tier is fine) — provides the PostgreSQL database and Auth
- Optional integrations (only needed for those features):
  - **Resend** account + API key — transactional email
  - **Azure OpenAI** resource — the in-app chatbot
  - VAPID key pair — web push notifications (`npx web-push generate-vapid-keys`)

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo-url>
cd V-Link

# Backend deps
cd backend && npm install && cd ..

# Frontend deps
cd frontend && npm install && cd ..
```

### 2. Set up the database

Create a Supabase project, then apply the schema and seed data from `sql/`.
Quickest path: open **Supabase → SQL Editor** and run, in order:

1. `sql/migrations/0001_init.sql`  (tables, enums, indexes)
2. `sql/migrations/0002_seed.sql`  (badges + sample skills/marketplace items)

Full instructions (psql / Supabase CLI / resetting) are in
[`sql/README.md`](sql/README.md).

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Then fill in the values:

- **Supabase URL + keys** — Supabase Dashboard → Project Settings → API
- **Database connection** (`DB_*`) — Supabase Dashboard → Project Settings → Database
- **Resend / Azure OpenAI / VAPID** — only if you use those features

> The real `.env` files are gitignored — never commit them.

### 4. Run the apps

In two terminals:

```bash
# Terminal 1 — backend API on http://localhost:3000
cd backend
npm run start:dev

# Terminal 2 — frontend on http://localhost:3001
cd frontend
npm run dev
```

Open <http://localhost:3001>.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key (server only — keep secret) |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | ✅ | Postgres connection |
| `PORT` | ✅ | API port (default `3000`) |
| `NODE_ENV` | ✅ | `development` / `production` |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins (e.g. `http://localhost:3001`) |
| `FRONTEND_URL` | ✅ | Public frontend URL (used in links/emails) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | ⬜ | Web push |
| `RESEND_API_KEY` | ⬜ | Email via Resend |
| `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_DEPLOYMENT` / `AZURE_OPENAI_API_VERSION` | ⬜ | Chatbot |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public/publishable key |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL (default `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public frontend URL (default `http://localhost:3001`) |

---

## Useful Commands

### Backend

| Command | Description |
|---|---|
| `npm run start:dev` | Run API in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled build |
| `npm test` | Run the test suite |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Run dev server (port 3001) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Lint |

---

## Notes

- The backend runs TypeORM with `synchronize: false` — schema changes must be
  applied via the SQL in `sql/` (keep it in sync with the entities).
- Google Calendar / Google OAuth integration has been deprecated and is no
  longer part of the setup.
