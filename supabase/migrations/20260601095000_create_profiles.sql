-- 5. Profiles — a person's persistent identity (carries across spaces)
-- ============================================================
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  domain text,
  phone text,
  linkedin text,
  created_at timestamptz default now()
);

-- ============================================================

