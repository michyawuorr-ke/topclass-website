-- 22. Delegated space/zone administration (multi-tier RBAC).
--
-- Adds Tier 2 (Space Admin — dean/HOD, delegated authority over one
-- Space and its Zones) and Tier 3 (Zone Publisher — professor/lecturer/
-- coordinator, publishing rights scoped to one Zone) on top of the
-- existing Tier 1 (organization_members: university-wide admin).
--
-- Permissions cascade downward: an org owner/admin can do everything a
-- space admin can; a space admin can do everything a zone publisher
-- can, within their own space. Nothing here removes org-level control
-- — it only adds narrower delegated grants underneath it.
-- ============================================================

create table space_admins (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid references auth.users(id), -- null until the invited person signs in and claims it
  invite_email text not null,
  created_at timestamptz default now()
);
alter table space_admins enable row level security;

create table zone_publishers (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references zones(id) on delete cascade,
  user_id uuid references auth.users(id), -- null until claimed, same pattern as above
  invite_email text not null,
  created_at timestamptz default now()
);
alter table zone_publishers enable row level security;

-- ------------------------------------------------------------
-- Cascading permission checks. security definer so they can read
-- across these tables without recursing through their own RLS —
-- same pattern as is_org_member().
-- ------------------------------------------------------------

-- True if the current user is a Tier-2+ admin of this space: either a
-- claimed space_admins row for it, or a Tier-1 org owner/admin of the
-- organization that owns it (cascade).
create or replace function is_space_admin(check_space_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from space_admins
    where space_id = check_space_id and user_id = auth.uid()
  ) or exists (
    select 1 from spaces s
    join organizations o on o.id = s.organization_id
    where s.id = check_space_id and o.owner_id = auth.uid()
  ) or exists (
    select 1 from spaces s
    join organization_members m on m.organization_id = s.organization_id
    where s.id = check_space_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  );
$$;

-- True if the current user can publish into this zone: either a
-- claimed zone_publishers row for it, or Tier-2+ admin of the space
-- that contains it (cascade).
create or replace function can_publish_to_zone(check_zone_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from zone_publishers
    where zone_id = check_zone_id and user_id = auth.uid()
  ) or is_space_admin((select space_id from zones where id = check_zone_id));
$$;

-- ------------------------------------------------------------
-- space_admins access
-- ------------------------------------------------------------

create policy "View own space's admins" on space_admins for select
  using (
    is_org_member((select organization_id from spaces where id = space_admins.space_id))
    or user_id = auth.uid()
  );

-- Only Tier-1 (org owner or role owner/admin) grants Tier-2 — matches
-- how organization_members restricts inviting to owner/admin, not
-- every org member.
create policy "Org owner/admin assigns space admins" on space_admins for insert
  with check (
    (select organization_id from spaces where id = space_admins.space_id) in (
      select id from organizations where owner_id = auth.uid()
    )
    or (select organization_id from spaces where id = space_admins.space_id) in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Invited space admin can claim their own invite" on space_admins for update
  using (user_id is null and invite_email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid());

create policy "Org owner/admin removes space admins" on space_admins for delete
  using (
    (select organization_id from spaces where id = space_admins.space_id) in (
      select id from organizations where owner_id = auth.uid()
    )
    or (select organization_id from spaces where id = space_admins.space_id) in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- ------------------------------------------------------------
-- zone_publishers access
-- ------------------------------------------------------------

create policy "View own zone's publishers" on zone_publishers for select
  using (
    is_space_admin((select space_id from zones where id = zone_publishers.zone_id))
    or user_id = auth.uid()
  );

-- Tier-2 (space admin, or anyone above it via cascade) grants Tier-3.
create policy "Space admin assigns zone publishers" on zone_publishers for insert
  with check (is_space_admin((select space_id from zones where id = zone_publishers.zone_id)));

create policy "Invited zone publisher can claim their own invite" on zone_publishers for update
  using (user_id is null and invite_email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid());

create policy "Space admin removes zone publishers" on zone_publishers for delete
  using (is_space_admin((select space_id from zones where id = zone_publishers.zone_id)));

-- ------------------------------------------------------------
-- Extend existing content policies: space admins can manage zones
-- under their space; zone publishers can manage content scoped to
-- their zone. Org-level access (is_org_member) is preserved — these
-- are additive OR conditions, not replacements.
-- ------------------------------------------------------------

drop policy if exists "Owner manage" on zones;
create policy "Owner manage" on zones for all
  using (
    is_org_member((select organization_id from spaces where id = zones.space_id))
    or is_space_admin(zones.space_id)
  )
  with check (
    is_org_member((select organization_id from spaces where id = zones.space_id))
    or is_space_admin(zones.space_id)
  );

drop policy if exists "Owner manage" on opportunities;
create policy "Owner manage" on opportunities for all
  using (
    is_org_member((select organization_id from spaces where id = opportunities.space_id))
    or is_space_admin(opportunities.space_id)
    or (opportunities.zone_id is not null and can_publish_to_zone(opportunities.zone_id))
  )
  with check (
    is_org_member((select organization_id from spaces where id = opportunities.space_id))
    or is_space_admin(opportunities.space_id)
    or (opportunities.zone_id is not null and can_publish_to_zone(opportunities.zone_id))
  );

drop policy if exists "Owner manage" on resources;
create policy "Owner manage" on resources for all
  using (
    is_org_member((select organization_id from spaces where id = resources.space_id))
    or is_space_admin(resources.space_id)
    or (resources.zone_id is not null and can_publish_to_zone(resources.zone_id))
  )
  with check (
    is_org_member((select organization_id from spaces where id = resources.space_id))
    or is_space_admin(resources.space_id)
    or (resources.zone_id is not null and can_publish_to_zone(resources.zone_id))
  );

drop policy if exists "Owner manage" on activities;
create policy "Owner manage" on activities for all
  using (
    is_org_member((select organization_id from spaces where id = activities.space_id))
    or is_space_admin(activities.space_id)
    or (activities.zone_id is not null and can_publish_to_zone(activities.zone_id))
  )
  with check (
    is_org_member((select organization_id from spaces where id = activities.space_id))
    or is_space_admin(activities.space_id)
    or (activities.zone_id is not null and can_publish_to_zone(activities.zone_id))
  );

-- ============================================================
-- Not covered here (deliberately deferred):
--   - No operator UI yet for inviting space admins / zone publishers
--     (organization_members has one via the team-invite flow; this
--     needs the same pattern extended, not built in this migration).
--   - SSO claims -> auto-provisioning is a separate integration: once
--     built, it should INSERT/claim space_admins & zone_publishers
--     rows automatically instead of requiring a manual invite.
--   - Global-vs-scoped discovery is a frontend query change, not a
--     schema change — no RLS work needed there.
-- ============================================================
