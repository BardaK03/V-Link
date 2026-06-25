# Database Setup

The V-Link backend (NestJS + TypeORM) runs with `synchronize: false`, so the
database schema is **not** created automatically. You must apply the SQL in this
folder to a Postgres database before starting the backend.

```
sql/migrations/
├── 0001_init.sql    # all tables, enums, indexes, foreign keys (REQUIRED)
└── 0002_seed.sql    # badges (required for the badge system) + sample data
```

Apply them **in order**: `0001_init.sql` first, then `0002_seed.sql`.

> The schema is generated 1:1 from the TypeORM entities in
> `backend/src/**/entities/*.entity.ts`. If you change an entity, update the SQL
> here to match (or regenerate — see "Verifying against a live DB" below).

---

## Option A — Supabase SQL Editor (easiest)

1. Open your project at <https://supabase.com/dashboard>.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of `0001_init.sql`, click **Run**.
4. Repeat with `0002_seed.sql`.

## Option B — `psql`

Use the connection string from
**Supabase Dashboard → Project Settings → Database** (or any Postgres URL):

```bash
psql "postgresql://<user>:<password>@<host>:5432/postgres" -f sql/migrations/0001_init.sql
psql "postgresql://<user>:<password>@<host>:5432/postgres" -f sql/migrations/0002_seed.sql
```

## Option C — Supabase CLI

```bash
# Link once (project ref from the dashboard URL)
supabase link --project-ref <your-project-ref>

# Apply the scripts
supabase db execute --file sql/migrations/0001_init.sql
supabase db execute --file sql/migrations/0002_seed.sql
```

---

## Auth note

The `users.auth_id` column stores the **Supabase Auth user UID**
(`auth.users.id`). The app creates a row in `users` for each authenticated
account; it is kept as a plain unique column (not a cross-schema foreign key) so
these scripts run on any Postgres instance. Sign-ups go through Supabase Auth,
and the backend links each profile via `auth_id`.

## Re-running / resetting

Both scripts are idempotent:

- `0001_init.sql` uses `CREATE TABLE IF NOT EXISTS` and guarded enum creation.
- `0002_seed.sql` uses `ON CONFLICT DO NOTHING`.

To start completely fresh, drop and recreate the `public` schema first
(**destroys all data**):

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then re-apply both scripts.

## Verifying against a live database (optional)

To confirm the DDL matches an existing database exactly, dump its schema and
diff it against `0001_init.sql`:

```bash
pg_dump --schema-only --no-owner --no-privileges \
  "postgresql://<user>:<password>@<host>:5432/postgres" > live_schema.sql
```
