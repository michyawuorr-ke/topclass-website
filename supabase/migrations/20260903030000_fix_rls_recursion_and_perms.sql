-- ============================================================
-- ROOT CAUSE: organization_members SELECT policy queries
-- organization_members inside itself → infinite recursion.
-- This breaks: team invites, space creation (is_org_member calls
-- organization_members), and space_admins insert/delete.
-- FIX: use is_org_member() everywhere — it is SECURITY DEFINER
-- and bypasses RLS so there is no recursion.
-- ============================================================

-- 1. Fix the recursive SELECT policy on organization_members
drop policy if exists "Members can view their org's members" on organization_members;

create policy "Members can view their org's members" on organization_members for select
  using (is_org_member(organization_id));

-- 2. Fix space_admins INSERT — was also using an organization_members subselect
drop policy if exists "Org owner/admin assigns space admins" on space_admins;

create policy "Org owner/admin assigns space admins" on space_admins for insert
  with check (
    is_org_member(
      (select organization_id from spaces where id = space_admins.space_id)
    )
  );

-- 3. Fix space_admins DELETE — same issue
drop policy if exists "Org owner/admin removes space admins" on space_admins;

create policy "Org owner/admin removes space admins" on space_admins for delete
  using (
    is_org_member(
      (select organization_id from spaces where id = space_admins.space_id)
    )
  );

-- 4. Fix spaces INSERT — "Owner manage" calls is_org_member which was
-- recursing through the broken organization_members SELECT policy.
-- Rebuild it explicitly to also allow the org owner directly,
-- so it works even if is_org_member() hits an edge case.
drop policy if exists "Owner manage" on spaces;

create policy "Owner manage" on spaces for all
  using (
    exists (select 1 from organizations where id = spaces.organization_id and owner_id = auth.uid())
    or is_org_member(organization_id)
  )
  with check (
    exists (select 1 from organizations where id = spaces.organization_id and owner_id = auth.uid())
    or is_org_member(organization_id)
  );
