-- 11. Row Level Security — enabled everywhere, NO wide-open anon policies.
-- These are intentionally restrictive placeholders (nothing is publicly
-- writable) rather than the previous "anon can do anything" policies.
-- Real per-user / per-space policies get built alongside auth — this just
-- makes sure nothing is silently exposed in the meantime.
-- ============================================================
alter table organizations enable row level security;
alter table spaces enable row level security;
alter table zones enable row level security;
alter table profiles enable row level security;
alter table presence enable row level security;
alter table connections enable row level security;
alter table opportunities enable row level security;
alter table resources enable row level security;
alter table activities enable row level security;

-- Public read on space/org/zone/opportunity/resource/activity data —
-- this is discovery content, meant to be visible to anyone browsing a space.
create policy "Public read" on organizations for select using (true);
create policy "Public read" on spaces for select using (true);
create policy "Public read" on zones for select using (true);
create policy "Public read" on opportunities for select using (true);
create policy "Public read" on resources for select using (true);
create policy "Public read" on activities for select using (true);

-- profiles, presence, and connections are NOT publicly readable/writable
-- by default — no policy is created for them here. Until real auth is
-- wired in, these tables are locked down; the app will need a service-role
-- key or proper auth-based policies to read/write them. This is
-- deliberate: better to block the app temporarily than leave personal
-- data (phone, LinkedIn, presence) open to anyone with the anon key.

-- ============================================================

