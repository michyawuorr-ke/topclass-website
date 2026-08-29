-- 9. Resources — bookable/usable assets a Space provides
-- ============================================================
create table resources (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  name text not null,
  owner text,
  availability text,
  conditions text,
  created_at timestamptz default now()
);

-- ============================================================

