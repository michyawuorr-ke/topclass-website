-- 12. MVP policies — no auth exists yet, so "own row" can't be enforced.
-- Deliberately permissive on read/write, deliberately NO delete policy
-- anywhere for anon. This is a known, temporary trade-off pending real
-- auth — not a silent return to the original wide-open state.
-- ============================================================
create policy "MVP public read" on profiles for select using (true);
create policy "MVP public insert" on profiles for insert with check (true);
create policy "MVP public update" on profiles for update using (true);

create policy "MVP public read" on presence for select using (true);
create policy "MVP public insert" on presence for insert with check (true);
create policy "MVP public update" on presence for update using (true);

create policy "MVP public read" on connections for select using (true);
create policy "MVP public insert" on connections for insert with check (true);
create policy "MVP public update" on connections for update using (true);

-- ============================================================

