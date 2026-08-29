-- 15. Real auth (anonymous sign-in) is now live — replace the
-- permissive MVP policies with actual per-user enforcement.
-- ============================================================

-- Tie profiles.id to the real auth identity
alter table profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- --- profiles: public read (discovery), owner-only write ---
drop policy if exists "MVP public read" on profiles;
drop policy if exists "MVP public insert" on profiles;
drop policy if exists "MVP public update" on profiles;
create policy "Public read" on profiles for select using (true);
create policy "Own insert" on profiles for insert with check (auth.uid() = id);
create policy "Own update" on profiles for update using (auth.uid() = id);

-- --- presence: public read (needed for the Discover/People lens), owner-only write ---
drop policy if exists "MVP public read" on presence;
drop policy if exists "MVP public insert" on presence;
drop policy if exists "MVP public update" on presence;
create policy "Public read" on presence for select using (true);
create policy "Own insert" on presence for insert with check (auth.uid() = profile_id);
create policy "Own update" on presence for update using (auth.uid() = profile_id);

-- --- connections: only the two participants can read or write their own rows ---
drop policy if exists "MVP public read" on connections;
drop policy if exists "MVP public insert" on connections;
drop policy if exists "MVP public update" on connections;
create policy "Participant read" on connections for select
  using (auth.uid() = profile_id or auth.uid() = connected_profile_id);
create policy "Participant insert" on connections for insert
  with check (auth.uid() = profile_id or auth.uid() = connected_profile_id);
create policy "Participant update" on connections for update
  using (auth.uid() = profile_id or auth.uid() = connected_profile_id);

-- --- messages: only sender/recipient can read; only the real sender can send ---
drop policy if exists "MVP public read" on messages;
drop policy if exists "MVP public insert" on messages;
create policy "Participant read" on messages for select
  using (auth.uid() = sender_profile_id or auth.uid() = recipient_profile_id);
create policy "Sender insert" on messages for insert
  with check (auth.uid() = sender_profile_id);

-- NOTE: profiles.phone / profiles.linkedin are still publicly SELECT-able
-- at the row level (RLS is row-level, not column-level) even though tier-2
-- sharing gates them at the app layer. Splitting contact fields into a
-- separate table with its own policy is the correct follow-up — flagged,
-- not yet done, so this isn't mistaken for solved.

-- ============================================================

