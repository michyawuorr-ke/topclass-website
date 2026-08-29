-- 4. Zones — an optional sub-area within a Space
-- ============================================================
create table zones (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  name text not null,   -- 'Lobby', 'Reading Room', 'Floor 2'
  created_at timestamptz default now()
);

-- ============================================================

