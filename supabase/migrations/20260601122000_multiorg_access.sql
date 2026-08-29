-- 20. Multi-person organization access. An org can only have one
-- owner_id, but real staff (a department, a hub team) need more than
-- one account. organization_members supports invite-by-email with
-- auto-claim on first matching login.
-- ============================================================

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id), -- null until the invited person signs in and claims it
  invite_email text not null,
  role text not null default 'staff', -- 'owner' | 'admin' | 'staff'
  created_at timestamptz default now()
);
alter table organization_members enable row level security;

create policy "Members can view their org's members" on organization_members for select
  using (
    organization_id in (select id from organizations where owner_id = auth.uid())
    or organization_id in (select organization_id from organization_members where user_id = auth.uid())
  );

create policy "Owner/admin can invite" on organization_members for insert
  with check (
    organization_id in (select id from organizations where owner_id = auth.uid())
    or organization_id in (
      select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Lets an invited person claim their own row: only when it's still
-- unclaimed (user_id is null) and the invite email matches their own
-- logged-in email — never lets anyone claim someone else's invite.
create policy "Invited user can claim their own invite" on organization_members for update
  using (user_id is null and invite_email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid());

-- Shared membership check, used by every ownership policy below instead
-- of duplicating the same union query six times. security definer so it
-- can read organizations/organization_members without recursing through
-- their own RLS.
create or replace function is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organizations where id = check_org_id and owner_id = auth.uid()
  ) or exists (
    select 1 from organization_members where organization_id = check_org_id and user_id = auth.uid()
  );
$$;

drop policy if exists "Owner manage" on organizations;
create policy "Owner manage" on organizations for all
  using (is_org_member(id)) with check (is_org_member(id));

drop policy if exists "Owner manage" on spaces;
create policy "Owner manage" on spaces for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop policy if exists "Owner manage" on zones;
create policy "Owner manage" on zones for all
  using (is_org_member((select organization_id from spaces where id = zones.space_id)))
  with check (is_org_member((select organization_id from spaces where id = zones.space_id)));

drop policy if exists "Owner manage" on opportunities;
create policy "Owner manage" on opportunities for all
  using (is_org_member((select organization_id from spaces where id = opportunities.space_id)))
  with check (is_org_member((select organization_id from spaces where id = opportunities.space_id)));

drop policy if exists "Owner manage" on resources;
create policy "Owner manage" on resources for all
  using (is_org_member((select organization_id from spaces where id = resources.space_id)))
  with check (is_org_member((select organization_id from spaces where id = resources.space_id)));

drop policy if exists "Owner manage" on activities;
create policy "Owner manage" on activities for all
  using (is_org_member((select organization_id from spaces where id = activities.space_id)))
  with check (is_org_member((select organization_id from spaces where id = activities.space_id)));

