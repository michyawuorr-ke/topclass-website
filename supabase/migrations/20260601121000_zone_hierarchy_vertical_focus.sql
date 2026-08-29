-- 19. Focus narrowed to Innovation Hub + University verticals.
-- Real spatial hierarchy: a zone can nest inside another zone
-- (Faculty -> Building -> Lecture Hall, or Hub -> Maker Lab -> Pod),
-- instead of one flat list.
-- ============================================================
alter table zones add column parent_zone_id uuid references zones(id);

-- ============================================================

