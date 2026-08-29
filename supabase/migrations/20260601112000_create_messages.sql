-- 14. Messages — chat, gated at the app level to open only after
-- connections.qr_scanned = true (physical meetup confirmed).
-- Keyed by profile pair, not connections.id, since each side of a
-- connection currently has its own row/id.
-- ============================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id),
  sender_profile_id uuid references profiles(id),
  recipient_profile_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;
create policy "MVP public read" on messages for select using (true);
create policy "MVP public insert" on messages for insert with check (true);
-- Deliberately no update/delete policy — messages are immutable once sent.

-- ============================================================

