-- ============================================================
-- Entry Config Migration
-- Run this in the Supabase SQL editor.
-- ============================================================

-- 1. Add environment type and branding to organizations
alter table organizations
  add column if not exists environment_type text default 'coworking'
    check (environment_type in ('coworking','innovation_hub','university','hotel','custom')),
  add column if not exists logo_url text,
  add column if not exists primary_color text default '#E26D34',
  add column if not exists background_color text default '#1C1C2E',
  -- entry_config stores operator overrides to the default config.
  -- Null means "use the full default for this environment_type".
  -- A partial JSON means "use default, but override these specific fields".
  add column if not exists entry_config jsonb default null;

-- 2. Add entry_config override at the space level
--    (space-level config wins over org-level, which wins over environment default)
alter table spaces
  add column if not exists entry_config jsonb default null;

-- 3. Add metadata column to profiles for custom environment-specific fields
--    (e.g. faculty, year_of_study, student_id, room_number, company_stage)
alter table profiles
  add column if not exists metadata jsonb default null,
  add column if not exists role_type text default 'member';

-- 4. Add invite_codes table for invite_code auth method
create table if not exists invite_codes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  code text not null,
  created_by uuid references profiles(id),
  max_uses integer default null,  -- null = unlimited
  use_count integer default 0,
  expires_at timestamptz default null,
  created_at timestamptz default now(),
  unique(space_id, code)
);

-- RLS for invite_codes
alter table invite_codes enable row level security;

create policy "Anyone can read invite codes to validate them"
  on invite_codes for select
  using (true);

create policy "Org admins can manage invite codes"
  on invite_codes for all
  using (
    exists (
      select 1 from spaces s
      join organizations o on o.id = s.organization_id
      where s.id = invite_codes.space_id
        and o.owner_id = auth.uid()
    )
  );

-- 5. Update existing organizations to set environment_type from their spaces
--    (one-time backfill based on the space.type that already exists)
update organizations o
set environment_type = (
  select s.type
  from spaces s
  where s.organization_id = o.id
  limit 1
)
where o.environment_type = 'coworking'
  and exists (
    select 1 from spaces s
    where s.organization_id = o.id
      and s.type in ('innovation_hub','university','hotel')
  );
