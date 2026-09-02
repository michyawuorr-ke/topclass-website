-- 24. Self-declare + one-tap approval (closes the "never invited" gap).
--
-- Google OAuth confirms identity + domain, but the only way someone
-- gets Tier 2/3 access so far is if a Tier 1/2 admin manually invited
-- their exact email first. This adds the other direction: a
-- domain-verified person can request a role themselves, a Tier 2+
-- admin approves or denies with one action, and approval creates the
-- real space_admins/zone_publishers row atomically — no separate
-- claim step needed since they're already signed in and verified.
-- ============================================================

create table access_requests (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,   -- set for a Space Admin request
  zone_id uuid references zones(id) on delete cascade,     -- set for a Zone Publisher request
  requester_user_id uuid references auth.users(id) not null,
  requester_email text not null,
  note text, -- self-declared context, e.g. "I'm the HOD for Sociology"
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  constraint access_requests_one_scope check (
    (space_id is not null and zone_id is null) or (space_id is null and zone_id is not null)
  )
);
alter table access_requests enable row level security;

-- A signed-in, domain-verified user can request access to their own
-- university's space/zone — nobody can request on someone else's
-- behalf, and (when the org set one) the domain must match.
create policy "Self can request access" on access_requests for insert
  with check (
    requester_user_id = auth.uid()
    and requester_email = (auth.jwt() ->> 'email')
    and (
      (space_id is not null and org_email_domain_matches((select organization_id from spaces where id = access_requests.space_id)))
      or
      (zone_id is not null and org_email_domain_matches((
        select s.organization_id from zones z join spaces s on s.id = z.space_id where z.id = access_requests.zone_id
      )))
    )
  );

create policy "View own or scoped requests" on access_requests for select
  using (
    requester_user_id = auth.uid()
    or (space_id is not null and is_space_admin(access_requests.space_id))
    or (zone_id is not null and is_space_admin((select space_id from zones where id = access_requests.zone_id)))
  );

create policy "Requester can cancel their own pending request" on access_requests for delete
  using (requester_user_id = auth.uid() and status = 'pending');

-- No update policy for regular users on purpose — approval/denial only
-- happens through the two functions below, which run as security
-- definer and so bypass RLS for their own writes. This keeps "resolve
-- a request" as one auditable, atomic action instead of a raw row edit.

create or replace function approve_access_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req access_requests%rowtype;
  target_space_id uuid;
begin
  select * into req from access_requests where id = request_id and status = 'pending';
  if not found then
    raise exception 'Request not found or already resolved';
  end if;

  if req.space_id is not null then
    if not is_space_admin(req.space_id) then
      raise exception 'Not authorized to approve this request';
    end if;
    insert into space_admins (space_id, user_id, invite_email)
      values (req.space_id, req.requester_user_id, req.requester_email);
  else
    select space_id into target_space_id from zones where id = req.zone_id;
    if not is_space_admin(target_space_id) then
      raise exception 'Not authorized to approve this request';
    end if;
    insert into zone_publishers (zone_id, user_id, invite_email)
      values (req.zone_id, req.requester_user_id, req.requester_email);
  end if;

  update access_requests set status = 'approved', resolved_at = now(), resolved_by = auth.uid()
    where id = request_id;
end;
$$;

create or replace function deny_access_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req access_requests%rowtype;
  target_space_id uuid;
begin
  select * into req from access_requests where id = request_id and status = 'pending';
  if not found then
    raise exception 'Request not found or already resolved';
  end if;

  if req.space_id is not null then
    if not is_space_admin(req.space_id) then
      raise exception 'Not authorized to deny this request';
    end if;
  else
    select space_id into target_space_id from zones where id = req.zone_id;
    if not is_space_admin(target_space_id) then
      raise exception 'Not authorized to deny this request';
    end if;
  end if;

  update access_requests set status = 'denied', resolved_at = now(), resolved_by = auth.uid()
    where id = request_id;
end;
$$;

-- ============================================================
-- Still deliberately out of scope: this only covers requesting
-- Space Admin / Zone Publisher access to an org that already exists
-- and already set email_domain. Someone whose university has no org
-- set up yet, or whose org never set a domain, still goes through
-- "set up your organization" as a new org owner — there's nothing to
-- request access to yet.
-- ============================================================
