-- 24. Teams & Departments — splits the old single "Zones" list into two
-- parallel tracks per the Spaces & Teams spec:
--   Physical  = zones (rooms/buildings, unchanged table, gains a
--               building tag) -> door QR codes for check-in.
--   Operational = teams (departments / functional crews) -> schedules,
--               operator invites, scoped opportunities, live roster,
--               announcements. A team MAY point at a home zone (e.g.
--               Department of Sociology -> Classroom L5) but is a
--               distinct entity, not a renamed zone.
--
-- Also extends the Spaces tab: spaces gain their own space_code and
-- domain_restriction (a School of Business can bind a narrower domain
-- than the university-wide one on organizations), so the Super Admin
-- "Space Creation Drawer" in the spec has real fields to write to.
-- ============================================================

-- ------------------------------------------------------------
-- Spaces tab: institutional code + domain binding per space
-- ------------------------------------------------------------
alter table spaces add column if not exists space_code text;
alter table spaces add column if not exists domain_restriction text;
create unique index if not exists spaces_space_code_key on spaces(space_code) where space_code is not null;

-- ------------------------------------------------------------
-- Physical zones: building tag (rooms already have name/description/
-- capacity/parent_zone_id from earlier migrations)
-- ------------------------------------------------------------
alter table zones add column if not exists building_tag text;

-- ------------------------------------------------------------
-- Teams: departments and functional crews within a Space
-- ------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  name text not null,                 -- 'Department of Sociology', 'Media Lab TAs'
  type text not null default 'department' check (type in ('department', 'crew')),
  description text,
  primary_zone_id uuid references zones(id),  -- home room/building, optional
  join_code text unique,              -- 6-digit self-onboarding code for lecturers/TAs
  created_at timestamptz default now()
);
alter table teams enable row level security;

-- Head of Department / Lead — Tier 2.5, delegated by the space admin
create table team_leads (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id),
  invite_email text not null,
  created_at timestamptz default now()
);
alter table team_leads enable row level security;

-- Lecturers / TAs / department operators — Tier 3, invited by email or
-- self-onboarded with the team's join code
create table team_operators (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id),
  invite_email text,
  created_at timestamptz default now()
);
alter table team_operators enable row level security;

-- Unit / course schedules — recurring weekly slots mapped to a room
create table schedules (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  course_code text,                   -- 'SOC 201'
  course_name text not null,          -- 'Urban Sociology'
  zone_id uuid references zones(id),  -- the room it meets in
  day_of_week text,                   -- 'Mon' | 'Tue' | ... (free text, kept simple)
  start_time text,                    -- '09:00'
  end_time text,                      -- '11:00'
  created_at timestamptz default now()
);
alter table schedules enable row level security;

-- Departmental announcements / notices
create table announcements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz default now()
);
alter table announcements enable row level security;

-- Opportunities/postings can now optionally be scoped to a department,
-- in addition to (or instead of) a physical zone.
alter table opportunities add column if not exists team_id uuid references teams(id);

-- ------------------------------------------------------------
-- Cascading permission checks, same pattern as is_space_admin /
-- can_publish_to_zone from the delegated RBAC migration.
-- ------------------------------------------------------------

create or replace function is_team_lead(check_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from team_leads
    where team_id = check_team_id and user_id = auth.uid()
  ) or is_space_admin((select space_id from teams where id = check_team_id));
$$;

create or replace function can_operate_team(check_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from team_operators
    where team_id = check_team_id and user_id = auth.uid()
  ) or is_team_lead(check_team_id);
$$;

-- Self-onboarding: a signed-in lecturer/TA redeems a team's join code
-- instead of waiting for an email invite. security definer so it can
-- insert past the normal team_operators insert policy (which is
-- scoped to leads only).
create or replace function redeem_team_join_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_team_id uuid;
  new_row_id uuid;
begin
  select id into found_team_id from teams where join_code = code;
  if found_team_id is null then
    raise exception 'Invalid join code';
  end if;
  if exists (select 1 from team_operators where team_id = found_team_id and user_id = auth.uid()) then
    return found_team_id;
  end if;
  insert into team_operators (team_id, user_id, invite_email)
  values (found_team_id, auth.uid(), auth.jwt() ->> 'email')
  returning id into new_row_id;
  return found_team_id;
end;
$$;

-- ------------------------------------------------------------
-- teams
-- ------------------------------------------------------------
create policy "Space admin manages teams" on teams for all
  using (is_space_admin(space_id))
  with check (is_space_admin(space_id));

create policy "Team lead/operator views own team" on teams for select
  using (is_team_lead(id) or can_operate_team(id));

-- ------------------------------------------------------------
-- team_leads
-- ------------------------------------------------------------
create policy "View own team's leads" on team_leads for select
  using (is_space_admin((select space_id from teams where id = team_leads.team_id)) or user_id = auth.uid());

create policy "Space admin assigns team leads" on team_leads for insert
  with check (is_space_admin((select space_id from teams where id = team_leads.team_id)));

create policy "Invited team lead can claim their own invite" on team_leads for update
  using (user_id is null and invite_email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid());

create policy "Space admin removes team leads" on team_leads for delete
  using (is_space_admin((select space_id from teams where id = team_leads.team_id)));

-- ------------------------------------------------------------
-- team_operators
-- ------------------------------------------------------------
create policy "View own team's operators" on team_operators for select
  using (is_team_lead(team_id) or user_id = auth.uid());

create policy "Team lead invites operators" on team_operators for insert
  with check (is_team_lead(team_id));

create policy "Invited operator can claim their own invite" on team_operators for update
  using (user_id is null and invite_email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid());

create policy "Team lead removes operators" on team_operators for delete
  using (is_team_lead(team_id));

-- ------------------------------------------------------------
-- schedules, announcements — managed by anyone who can operate the
-- team (lead or operator); visible to the same group plus org/space
-- admins above them (already covered, since can_operate_team cascades
-- through is_team_lead -> is_space_admin).
-- ------------------------------------------------------------
create policy "Team manages schedules" on schedules for all
  using (can_operate_team(team_id))
  with check (can_operate_team(team_id));

create policy "Team manages announcements" on announcements for all
  using (can_operate_team(team_id))
  with check (can_operate_team(team_id));

-- ------------------------------------------------------------
-- opportunities: extend existing "Owner manage" policy to include
-- department-level publishing, same additive-OR pattern as the zone
-- publisher extension.
-- ------------------------------------------------------------
drop policy if exists "Owner manage" on opportunities;
create policy "Owner manage" on opportunities for all
  using (
    is_org_member((select organization_id from spaces where id = opportunities.space_id))
    or is_space_admin(opportunities.space_id)
    or (opportunities.zone_id is not null and can_publish_to_zone(opportunities.zone_id))
    or (opportunities.team_id is not null and can_operate_team(opportunities.team_id))
  )
  with check (
    is_org_member((select organization_id from spaces where id = opportunities.space_id))
    or is_space_admin(opportunities.space_id)
    or (opportunities.zone_id is not null and can_publish_to_zone(opportunities.zone_id))
    or (opportunities.team_id is not null and can_operate_team(opportunities.team_id))
  );

-- ============================================================
-- Not covered here (deliberately deferred):
--   - No true schedule-time-window attendance log. "Live roster" for a
--     team reads presence.zone_id against the team's primary_zone_id,
--     same technique ZoneOperatorView already uses for "present in
--     zone now" — real, but not yet correlated against a specific
--     scheduled class slot.
--   - Room door QR codes encode `${origin}/?space=<id>&zone=<id>`;
--     the participant EntryFlow doesn't consume the `zone` param yet,
--     so scanning one currently just enters the space, not the room.
--     Wiring that up is a follow-up, not a blocker for printing them.
--   - team_operators (plain lecturers/TAs, not leads) have no routed
--     dashboard yet at /operator — only team_leads do. Their invite
--     rows and join-code self-onboarding work today; a lighter
--     operator-only view is a natural next step.
-- ============================================================

