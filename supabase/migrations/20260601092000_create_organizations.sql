-- 2. Organizations (operators) — the entity that configures a Space
-- ============================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- ============================================================

