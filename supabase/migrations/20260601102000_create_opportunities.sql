-- 8. Opportunities — organization-authored, structured
-- ============================================================
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  title text not null,
  type text,            -- 'scholarship' | 'internship' | 'program' | 'office_hours' | ...
  provider text,
  eligibility text,
  location text,
  deadline timestamptz,
  conditions text,
  next_steps text,
  created_at timestamptz default now()
);

-- ============================================================

