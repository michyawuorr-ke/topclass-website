-- 6. Presence — a profile being "here" right now, space/zone scoped
-- ============================================================
create table presence (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  space_id uuid references spaces(id) on delete cascade,
  zone_id uuid references zones(id),
  intent text,        -- free-text display label / fallback
  need text,           -- structured: what this person is looking for
  offer text,          -- structured: what this person can give
  station text,        -- 'current_station' equivalent — where in the space
  last_seen timestamptz default now()
);

-- ============================================================

