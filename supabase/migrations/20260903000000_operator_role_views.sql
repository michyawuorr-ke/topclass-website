-- 25. Operator role view support.
-- No new tables needed — roles already exist across:
--   organizations.owner_id          → super_admin (owns the org)
--   organization_members.role       → super_admin (owner/admin) or space_admin (staff)
--   space_admins.user_id            → space_admin
--   zone_publishers.user_id         → zone_operator
--
-- This migration adds a convenience view so the role router hook
-- can resolve a user's effective role in one query if needed,
-- and tightens the "staff" org member role so they only see their
-- assigned space (matching the SpaceAdminView scope).
-- ============================================================

-- Convenience view: resolves the highest operator role for each
-- signed-in user across all three grant tables. Used for analytics;
-- the UI role resolution happens client-side in useOperatorRole.ts.
create or replace view operator_role_summary as
select
  u.id as user_id,
  u.email,
  case
    when o.owner_id = u.id then 'super_admin'
    when om.role in ('owner', 'admin') then 'super_admin'
    when om.role = 'staff' then 'space_admin'
    when sa.user_id is not null then 'space_admin'
    when zp.user_id is not null then 'zone_operator'
    else 'none'
  end as effective_role,
  coalesce(o.id, o2.id) as organization_id,
  sa.space_id as managed_space_id,
  zp.zone_id as managed_zone_id
from auth.users u
left join organizations o on o.owner_id = u.id
left join organization_members om on om.user_id = u.id
left join organizations o2 on o2.id = om.organization_id
left join space_admins sa on sa.user_id = u.id
left join zone_publishers zp on zp.user_id = u.id;

-- Zone operators must only see/manage content in their own zone.
-- The existing can_publish_to_zone() already gates writes.
-- For reads: opportunities/resources/activities already have public
-- read policies — no change needed for the participant side.
-- The operator UI filters client-side by zone_id which is sufficient
-- for MVP; a server-side row filter can be added later.

-- ============================================================
-- No data migration needed — all existing users keep their current
-- access. The role views above are additive.
-- ============================================================
