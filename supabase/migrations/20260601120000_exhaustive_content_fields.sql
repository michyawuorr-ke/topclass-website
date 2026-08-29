-- 18. Exhaustive organization/opportunity/resource/activity fields,
-- matching industry-standard listing shapes (job boards, scholarship
-- databases, event platforms) rather than a thin generic form.
-- ============================================================

alter table organizations
  add column description text,
  add column website text,
  add column contact_email text,
  add column contact_phone text;

alter table zones
  add column description text,
  add column capacity text;

alter table opportunities
  add column description text,
  add column compensation text,
  add column application_method text,
  add column zone_id uuid references zones(id),
  add column status text not null default 'open';

alter table resources
  add column description text,
  add column capacity text,
  add column zone_id uuid references zones(id);

alter table activities
  add column description text,
  add column capacity text,
  add column zone_id uuid references zones(id),
  add column registration_link text,
  add column category text;

-- ============================================================

