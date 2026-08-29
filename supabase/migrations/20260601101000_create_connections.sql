-- 7. Connections — two profiles who've handshaked (replaces vault_connections)
-- ============================================================
create table connections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  connected_profile_id uuid references profiles(id) on delete cascade,
  space_id uuid references spaces(id),   -- where the connection happened
  handshake_accepted boolean default false,
  qr_scanned boolean default false,
  tier2_request_pending boolean default false,
  requested_phone boolean default false,
  requested_linkedin boolean default false,
  shared_phone boolean default false,
  shared_linkedin boolean default false,
  sticky_note text,
  created_at timestamptz default now()
);

-- ============================================================

