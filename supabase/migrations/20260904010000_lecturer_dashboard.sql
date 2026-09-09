-- 26. Lecturer dashboard support: assigning a specific lecturer/TA to a
-- specific scheduled unit (not just "operates this department" broadly),
-- plus the tables that dashboard needs — attendance sessions/logs and
-- course materials.
--
-- team_operators already covers "this person can publish/manage for the
-- department." schedule_lecturers is a narrower delegation on top of
-- that: "this person specifically teaches THIS unit," same invite/claim
-- pattern as everywhere else in the app.
-- ============================================================

create table schedule_lecturers (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references schedules(id) on delete cascade,
  user_id uuid references auth.users(id),
  invite_email text,
  created_at timestamptz default now()
);
alter table schedule_lecturers enable row level security;

-- Attendance sessions — a lecturer opens one for a scheduled class,
-- students check in while it's open, lecturer closes it.
create table attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references schedules(id) on delete cascade,
  zone_id uuid references zones(id),
  opened_by uuid references auth.users(id),
  opened_at timestamptz default now(),
  closed_at timestamptz
);
alter table attendance_sessions enable row level security;

create table attendance_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references attendance_sessions(id) on delete cascade,
  profile_id uuid references profiles(id),
  scanned_at timestamptz default now()
);
alter table attendance_logs enable row level security;

create table course_materials (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references schedules(id) on delete cascade,
  team_id uuid references teams(id),
  title text not null,
  file_url text not null,
  file_type text,
  unit_code text,
  unit_name text,
  uploader_id uuid references auth.users(id),
  uploaded_at timestamptz default now()
);
alter table course_materials enable row level security;

-- Extend can_operate_team so a lecturer who is ONLY assigned via
-- schedule_lecturers (not also a full team_operator) still passes every
-- existing "can this person publish for the department" check —
-- opportunities/activities/announcements/course_materials all gate on
-- can_operate_team(), not is_schedule_lecturer(), so without this a
-- schedule-only lecturer could open attendance but couldn't post
-- anything, which defeats the point of the Publish tab on their
-- dashboard.
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
  ) or exists (
    select 1 from schedule_lecturers sl
    join schedules s on s.id = sl.schedule_id
    where s.team_id = check_team_id and sl.user_id = auth.uid()
  ) or is_team_lead(check_team_id);
$$;

-- ------------------------------------------------------------
-- Cascading check: a specific schedule_lecturers claim, OR anyone who
-- can already operate the department (HOD, space admin, org owner).
-- ------------------------------------------------------------
create or replace function is_schedule_lecturer(check_schedule_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from schedule_lecturers
    where schedule_id = check_schedule_id and user_id = auth.uid()
  ) or can_operate_team((select team_id from schedules where id = check_schedule_id));
$$;

-- ------------------------------------------------------------
-- schedule_lecturers
-- ------------------------------------------------------------
create policy "View own schedule assignment" on schedule_lecturers for select
  using (
    can_operate_team((select team_id from schedules where id = schedule_lecturers.schedule_id))
    or user_id = auth.uid()
  );

create policy "Team lead assigns lecturers to schedules" on schedule_lecturers for insert
  with check (is_team_lead((select team_id from schedules where id = schedule_lecturers.schedule_id)));

create policy "Invited lecturer can claim their own invite" on schedule_lecturers for update
  using (user_id is null and invite_email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid());

create policy "Team lead removes schedule assignment" on schedule_lecturers for delete
  using (is_team_lead((select team_id from schedules where id = schedule_lecturers.schedule_id)));

-- ------------------------------------------------------------
-- attendance_sessions / attendance_logs
-- ------------------------------------------------------------
create policy "Lecturer manages attendance sessions" on attendance_sessions for all
  using (is_schedule_lecturer(schedule_id))
  with check (is_schedule_lecturer(schedule_id));

create policy "Lecturer views attendance logs" on attendance_logs for select
  using (
    is_schedule_lecturer((select schedule_id from attendance_sessions where id = attendance_logs.session_id))
  );

-- Deliberately permissive insert, matching this codebase's established
-- "MVP-permissive now, tighten once the real check-in flow exists"
-- pattern: anyone can log an attendance scan against a session that is
-- still open. There is no participant-facing "scan to check in" UI yet
-- (same gap as the room-QR-doesn't-auto-set-zone gap noted elsewhere) —
-- this just makes sure the table/policy is ready for it rather than
-- blocking on a migration once that UI is built.
create policy "Anyone logs attendance to an open session" on attendance_logs for insert
  with check (
    exists (select 1 from attendance_sessions where id = attendance_logs.session_id and closed_at is null)
  );

-- ------------------------------------------------------------
-- course_materials
-- ------------------------------------------------------------
create policy "Team manages course materials" on course_materials for all
  using (can_operate_team(team_id) or is_schedule_lecturer(schedule_id))
  with check (can_operate_team(team_id) or is_schedule_lecturer(schedule_id));

-- ------------------------------------------------------------
-- Not covered here (deliberately deferred, same spirit as prior gaps):
--   - No participant-facing "scan room QR to log attendance" flow yet.
--     attendance_logs is ready to receive inserts once that's built.
--   - No routed dashboard for a schedule_lecturers row whose person
--     ISN'T also a team_operator — is_schedule_lecturer already covers
--     access for them, this just flags that the wider "does this person
--     see anything else in the app" question isn't addressed here.
-- ============================================================

