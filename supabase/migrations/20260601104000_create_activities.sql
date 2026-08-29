-- 10. Activities — time-bound events within a Space
-- ============================================================
create table activities (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  title text not null,
  host text,
  start_time timestamptz,
  end_time timestamptz,
  purpose text,
  created_at timestamptz default now()
);

-- ============================================================

