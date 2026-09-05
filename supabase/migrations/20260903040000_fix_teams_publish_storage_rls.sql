-- ============================================================
-- Fix 1: is_space_admin() queries organization_members which
-- has RLS that still recurses. Rebuild it to go through
-- organizations directly for org-owner check, and use a
-- direct user_id check for org members — avoiding the
-- recursive SELECT policy on organization_members.
-- ============================================================

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
    select 1 from organization_members m
    join spaces s on s.organization_id = m.organization_id
    where s.id = check_space_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

-- ============================================================
-- Fix 2: opportunities/resources/activities RLS blocks inserts
-- when zone_id IS NULL (space-level posts have no zone).
-- Allow space admins to insert without a zone_id.
-- ============================================================

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
-- Fix 3: teams RLS — allow space admins to insert departments
-- ============================================================

drop policy if exists "Owner manage" on teams;
create policy "Owner manage" on teams for all
  using (
    is_org_member((select organization_id from spaces where id = teams.space_id))
    or is_space_admin(teams.space_id)
  )
  with check (
    is_org_member((select organization_id from spaces where id = teams.space_id))
    or is_space_admin(teams.space_id)
  );

-- ============================================================
-- Fix 4: storage bucket policy for toruok-media
-- Allow any authenticated user to upload
-- ============================================================

drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'toruok-media');

drop policy if exists "Media is publicly readable" on storage.objects;
create policy "Media is publicly readable" on storage.objects
  for select using (bucket_id = 'toruok-media');
