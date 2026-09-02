-- 23. SSO domain-gated provisioning.
--
-- Google Workspace OAuth (and OAuth generally) gives you a verified
-- email and nothing else — no role, no department, no institutional
-- claims. The role mapping already exists in *which table* an invite
-- sits in (space_admins vs zone_publishers vs organization_members);
-- what this migration adds is the missing piece for "official email
-- domain authentication": an org can optionally pin an
-- `email_domain`, and claiming a Tier 2/3 invite then requires the
-- signed-in Google account to actually be on that domain, not just
-- match the invited address.
--
-- This does NOT touch how invites are created — an org can still
-- invite anyone. It only gates the claim step, which is the point
-- where an invite becomes real access.
-- ============================================================

alter table organizations add column email_domain text;

-- True if the org has no email_domain set (no restriction configured),
-- or the current signed-in user's verified email ends with
-- @<that domain>. security definer + stable, same pattern as the
-- other permission helpers.
create or replace function org_email_domain_matches(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select email_domain is null
       or lower(auth.jwt() ->> 'email') like '%@' || lower(email_domain)
     from organizations where id = check_org_id),
    true
  );
$$;

-- ------------------------------------------------------------
-- Re-gate the three claim policies with the domain check.
-- ------------------------------------------------------------

drop policy if exists "Invited user can claim their own invite" on organization_members;
create policy "Invited user can claim their own invite" on organization_members for update
  using (
    user_id is null
    and invite_email = (auth.jwt() ->> 'email')
    and org_email_domain_matches(organization_members.organization_id)
  )
  with check (user_id = auth.uid());

drop policy if exists "Invited space admin can claim their own invite" on space_admins;
create policy "Invited space admin can claim their own invite" on space_admins for update
  using (
    user_id is null
    and invite_email = (auth.jwt() ->> 'email')
    and org_email_domain_matches((select organization_id from spaces where id = space_admins.space_id))
  )
  with check (user_id = auth.uid());

drop policy if exists "Invited zone publisher can claim their own invite" on zone_publishers;
create policy "Invited zone publisher can claim their own invite" on zone_publishers for update
  using (
    user_id is null
    and invite_email = (auth.jwt() ->> 'email')
    and org_email_domain_matches((
      select s.organization_id from zones z join spaces s on s.id = z.space_id
      where z.id = zone_publishers.zone_id
    ))
  )
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Bug fix, surfaced while wiring this up: "Owner manage" on `spaces`
-- was never extended with is_space_admin() in the Tier 2/3 migration
-- (only zones/opportunities/resources/activities were). Without this,
-- a space admin who isn't also an org member can't see or manage the
-- one space they were actually delegated — which defeats the point of
-- Tier 2 existing at all once org owners stop being the only people
-- signing in.
-- ------------------------------------------------------------

drop policy if exists "Owner manage" on spaces;
create policy "Owner manage" on spaces for all
  using (is_org_member(spaces.organization_id) or is_space_admin(spaces.id))
  with check (is_org_member(spaces.organization_id) or is_space_admin(spaces.id));

-- ============================================================
-- Manual step required (not SQL): enable Google as an OAuth provider
-- in Supabase — Authentication > Providers > Google — using a Google
-- Cloud OAuth client. This has to be done once per Supabase project
-- in the dashboard; there's no migration for it.
--
-- Still deliberately out of scope here:
--   - Auto-creating space_admin/zone_publisher rows for someone who
--     was never manually invited (true zero-touch provisioning from
--     just a role/department claim). Google Workspace OAuth doesn't
--     hand you that claim, so this needs either a self-declare +
--     one-tap operator approval flow, or a Google Admin SDK directory
--     lookup (needs domain-wide delegation — a real ask of university
--     IT, not just code). Flagged as the natural next step, not built.
-- ============================================================
