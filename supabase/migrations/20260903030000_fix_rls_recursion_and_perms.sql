drop policy if exists "Members can view their org's members" on organization_members;
create policy "Members can view their org's members" on organization_members for select
  using (is_org_member(organization_id));

drop policy if exists "Org owner/admin assigns space admins" on space_admins;
create policy "Org owner/admin assigns space admins" on space_admins for insert
  with check (is_org_member((select organization_id from spaces where id = space_admins.space_id)));

drop policy if exists "Org owner/admin removes space admins" on space_admins;
create policy "Org owner/admin removes space admins" on space_admins for delete
  using (is_org_member((select organization_id from spaces where id = space_admins.space_id)));
