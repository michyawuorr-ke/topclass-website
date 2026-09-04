-- 25. Departments/Buildings refinement — supports the restyled
-- Space Admin (Departments/Buildings/Publish/Applications) and HOD
-- (Rooms/Schedules/Publish/Applications/Notices) dashboards.
--
-- Departments now carry their own capacity (separate from any room),
-- and resources/activities can be scoped to a department the same
-- way opportunities already were, so a department's "Publish" tab
-- can show only its own postings.
-- ============================================================

alter table teams add column if not exists capacity text;

alter table resources add column if not exists team_id uuid references teams(id);
alter table activities add column if not exists team_id uuid references teams(id);

drop policy if exists "Owner manage" on resources;
create policy "Owner manage" on resources for all
  using (
    is_org_member((select organization_id from spaces where id = resources.space_id))
    or is_space_admin(resources.space_id)
    or (resources.zone_id is not null and can_publish_to_zone(resources.zone_id))
    or (resources.team_id is not null and can_operate_team(resources.team_id))
  )
  with check (
    is_org_member((select organization_id from spaces where id = resources.space_id))
    or is_space_admin(resources.space_id)
    or (resources.zone_id is not null and can_publish_to_zone(resources.zone_id))
    or (resources.team_id is not null and can_operate_team(resources.team_id))
  );

drop policy if exists "Owner manage" on activities;
create policy "Owner manage" on activities for all
  using (
    is_org_member((select organization_id from spaces where id = activities.space_id))
    or is_space_admin(activities.space_id)
    or (activities.zone_id is not null and can_publish_to_zone(activities.zone_id))
    or (activities.team_id is not null and can_operate_team(activities.team_id))
  )
  with check (
    is_org_member((select organization_id from spaces where id = activities.space_id))
    or is_space_admin(activities.space_id)
    or (activities.zone_id is not null and can_publish_to_zone(activities.zone_id))
    or (activities.team_id is not null and can_operate_team(activities.team_id))
  );

