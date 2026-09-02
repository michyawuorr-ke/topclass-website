-- message_requests: Instagram-style gate
create table if not exists message_requests (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id),
  sender_profile_id uuid references profiles(id),
  recipient_profile_id uuid references profiles(id),
  intro_body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique (sender_profile_id, recipient_profile_id)
);

alter table message_requests enable row level security;
create policy "owner read"       on message_requests for select using (auth.uid() = sender_profile_id or auth.uid() = recipient_profile_id);
create policy "sender insert"    on message_requests for insert with check (auth.uid() = sender_profile_id);
create policy "recipient update" on message_requests for update using (auth.uid() = recipient_profile_id);

-- read receipts
alter table messages add column if not exists read_at timestamptz default null;

-- tighten messages insert (drop permissive MVP policy first)
drop policy if exists "MVP public insert" on messages;
drop policy if exists "MVP public read"   on messages;

create policy "insert if connected" on messages for insert with check (
  auth.uid() = sender_profile_id
  and (
    exists (
      select 1 from connections
      where profile_id = auth.uid()
        and connected_profile_id = recipient_profile_id
        and handshake_accepted = true
    )
    or
    exists (
      select 1 from message_requests
      where sender_profile_id = auth.uid()
        and recipient_profile_id = messages.recipient_profile_id
        and status = 'accepted'
    )
  )
);

create policy "participants read"  on messages for select using (auth.uid() = sender_profile_id or auth.uid() = recipient_profile_id);
create policy "recipient mark read" on messages for update using (auth.uid() = recipient_profile_id) with check (auth.uid() = recipient_profile_id);
