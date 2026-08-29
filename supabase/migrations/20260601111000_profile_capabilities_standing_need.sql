-- 13. Profile redesign: standing Capabilities / Standing Need,
-- separate from the per-space Presence.need/offer (situational).
-- ============================================================
alter table profiles
  add column capabilities text,
  add column standing_need text;

-- ============================================================

