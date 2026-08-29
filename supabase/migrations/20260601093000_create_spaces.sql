-- 3. Spaces — a physical location an organization runs
-- ============================================================
create table spaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  type text not null,   -- 'hotel' | 'school' | 'cafe' | 'library' | 'coworking' | 'university'
  created_at timestamptz default now()
);

-- ============================================================

