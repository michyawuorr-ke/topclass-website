-- 16. Operator ownership + RLS: an organization is owned by a real
-- (magic-link authenticated) user, who can manage their own spaces,
-- zones, opportunities, resources, and activities. Public read stays
-- open on all of these (existing policies) — this only restricts writes.
-- ============================================================
alter table organizations add column owner_id uuid references auth.users(id);

create policy "Owner manage" on organizations for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Owner manage" on spaces for all
  using (organization_id in (select id from organizations where owner_id = auth.uid()))
  with check (organization_id in (select id from organizations where owner_id = auth.uid()));

create policy "Owner manage" on zones for all
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ))
  with check (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ));

create policy "Owner manage" on opportunities for all
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ))
  with check (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ));

create policy "Owner manage" on resources for all
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ))
  with check (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ));

create policy "Owner manage" on activities for all
  using (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ))
  with check (space_id in (
    select s.id from spaces s join organizations o on o.id = s.organization_id
    where o.owner_id = auth.uid()
  ));

-- ============================================================

