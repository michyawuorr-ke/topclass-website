-- 17. Operator approval gate: self-serve org/space creation stays
-- frictionless, but participant-facing visibility requires the
-- organization to be approved. Owners still see their own
-- unapproved content via the existing "Owner manage" policies —
-- this only restricts what OTHER people (participants) can read.
-- ============================================================
alter table organizations add column approved boolean not null default false;

drop policy if exists "Public read" on spaces;
create policy "Public read (approved only)" on spaces for select
  using (organization_id in (select id from organizations where approved = true));

drop policy if exists "Public read" on zones;
create policy "Public read (approved only)" on zones for select
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.approved = true
  ));

drop policy if exists "Public read" on opportunities;
create policy "Public read (approved only)" on opportunities for select
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.approved = true
  ));

drop policy if exists "Public read" on resources;
create policy "Public read (approved only)" on resources for select
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.approved = true
  ));

drop policy if exists "Public read" on activities;
create policy "Public read (approved only)" on activities for select
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.approved = true
  ));

-- Convenience queries for approving organizations (no admin UI yet —
-- deliberate for now, at this volume; revisit once there's enough
-- operator signups to justify building one):
--
--   select id, name, owner_id, approved from organizations order by id;
--   update organizations set approved = true where id = '<org-id>';

-- ============================================================

