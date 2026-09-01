# Toruok Space — Project Log

Running record of what this is, what's been decided, and what's actually
built. Updated as part of every change, not written once and forgotten.

## What this is

A human opportunity engine for physical spaces. **Focus narrowed to two
verticals: University and Innovation Hub** — chosen because they're the
environments with real institutional hierarchy (a department isn't the
whole university; a mentoring pod isn't the whole hub) and real
multi-person staff, unlike a hotel's ephemeral single-visit guests or a
café's flat structure. Hotel/coworking/library/café were part of an
earlier four-beachhead exploration but are deliberately out of scope
for now — narrowing was a conscious decision, not a limitation
discovered by accident.

For the University vertical specifically: **model one campus, not a
federation.** Research confirmed UoN alone spans 11 campuses, 6
colleges, and 87 departments — genuinely federated complexity that
would be a massive overreach to model now. One Organization = one
campus (any of UoN Main Campus, TUK, KU, KCA, etc.) with Zones for its
faculties/buildings/rooms works cleanly with the schema as-is; no
special-casing needed. Multi-campus federation is a real future
direction, not a blocker today.

Not a networking or presence app: the point isn't "people are nearby,"
it's "here's an opportunity — a person, a resource, a scheduled
activity — relevant to what you need or can offer, in the space you're
actually in right now."

Name: **Toruok Space** (styled TORUOK). Deliberately invented — not a
real Luo or Swahili word — chosen for its sound, echoing the real Dholuo
"-ruok" suffix (as in "chokruok," a gathering).

Core requirement: **everything has to be configurable.** Organizations
configure the platform per space type; participants get one consistent
interface regardless of which space they're in.

Formerly named TopClass; renamed after discovering the name collided
with an existing LMS/certification product.

## Architecture

- **Organizations** author and configure a **Space** (hotel, school,
  café, library, coworking, university). Spaces contain **Zones**
  (optional sub-areas).
- **Profiles** are a person's persistent identity — capabilities and
  standing interest, not a full résumé. Deliberately narrower than
  LinkedIn: just enough for matching and recognition.
- **Presence** is a profile being visible in a specific space right now,
  with situational **Need** and **Offer** (split fields, not one
  free-text "intent" blob).
- **Opportunities**, **Resources**, and **Activities** are
  organization-authored content, distinct from person-to-person
  presence/matching.
- **Connections** happen via handshake (mutual accept) or QR scan
  (instant, physically co-present).
- **Chat** is gated on physical confirmation, not just a digital match:
  handshake acceptance unlocks light coordination (seeing the other
  person's live station in the space); a QR scan confirming an
  in-person meetup is what actually opens chat. This isn't meant to
  compete with WhatsApp/Instagram feature-for-feature — it exists to
  get two people talking before they've decided to trust each other
  with a phone number, not to replace where the relationship lives
  afterward.
- **Discover** is one workspace with switchable lenses (For You /
  People / Opportunities / Resources / Activities) — not separate tabs
  competing for attention.

Navigation: Discover / Connections / My Journey, with Profile reached
via the avatar (top-left) rather than as a nav tab.

## Stack

Next.js 16, TypeScript, Supabase (Postgres + RLS + Realtime + Auth),
Tailwind CSS. Deployed to Vercel. Developed entirely from Termux on
Android — every schema change ships as a standalone `.sql` file for the
Supabase SQL Editor, every code change ships as a heredoc-based shell
script that writes the file, type-checks with `npx tsc --noEmit`, and
prints the exact `git add` command (never `git add -A`).

## Database (current, as of the real-auth pass)

`organizations`, `spaces`, `zones`, `profiles`, `presence`,
`connections`, `opportunities`, `resources`, `activities`, `messages`.

Auth: **Supabase anonymous sign-in** — frictionless walk-up identity
(no signup gate), with `auth.uid()` now enforced via real RLS policies
(not the earlier MVP-permissive placeholders). An optional
identity-upgrade path (linking phone/email later, for persistence
across devices) is deliberately deferred, not built yet.

## Known gaps (flagged, not yet solved)

- `profiles.phone` / `profiles.linkedin` are still publicly
  SELECT-able at the row level — RLS is row-level, not column-level, so
  the app-layer tier-2 gating isn't backed by a real database
  restriction yet. Splitting contact fields into their own table with
  its own policy is the correct fix.
- Own QR-code *display* (so someone else can scan you) was never
  rebuilt — only the scanning side was ported during the frontend
  rebuild.
- No identity-upgrade path yet from anonymous to a persistent
  phone/email-linked account.
- Opportunity/Resource/Activity field sets are fixed columns, not
  vertical-configurable. A `metadata` JSONB column (per the beachhead
  spec's configuration-engine idea) is the deliberately-deferred,
  cheap version of true schema configurability — not built yet.

## Code structure

Both apps are split into hooks (logic) + components (markup), never one
large file:

- **`/operator`**: `page.tsx` orchestrates only; screens live in
  `operator/components/`, shared types/constants in `operator/types.ts`.
- **`/` (participant app)**: `page.tsx` (125 lines) composes six hooks —
  `useAlert`, `useIdentity` (space + persistent profile), `useDiscover`
  (presence/opportunities/resources/activities), `usePresence`
  (become-visible flow), `useConnections` (handshake/QR/tier-2),
  `useChat` (gated on `qr_scanned`) — with markup in
  `app/components/` and shared types in `app/types.ts`.

Rule going forward: no screen's logic and markup live in the same file
once a screen has real state or side effects — extract a hook and a
component rather than letting any one file grow past what a new
developer can read in one sitting.

## Operator side (`/operator`)
email** (persistent identity, since they return to manage a space over
time — unlike participants, who are anonymous walk-ins by design). An
operator creates one Organization, then one or more Spaces under it
(currently: University or Innovation Hub), then configures **Zones**
(rooms/areas — a real nested hierarchy via `parent_zone_id`, e.g.
Faculty > Building > Lecture Hall, or Hub > Maker Lab > Pod) and
authors Opportunities/Resources/Activities, each optionally tagged to
a specific zone. The participant link for a space (`/?space=<id>`) is
shown directly in the dashboard.

**Multi-person access**: an organization is no longer limited to one
account. `organization_members` supports inviting a teammate by email
(owner/admin only); when that person signs in at `/operator` with a
matching email, they're automatically attached to the org on login —
no separate claim step. RLS ownership checks across
organizations/spaces/zones/opportunities/resources/activities all go
through one shared `is_org_member()` function rather than duplicating
the same membership query six times.

Content forms match industry-standard listing shapes rather than one
generic form reused across types — a Scholarship/Job/Grant opportunity
has description, eligibility, compensation, deadline, and application
method as real fields, not a single free-text blob. Participants can
actually **apply** to an opportunity (optional note), not just view it
— operators see and manage applications (status: applied → shortlisted
→ accepted/rejected) in a dedicated Applications tab. This closes the
core opportunity-engine loop that was previously read-only.

**Home tab** (the default landing tab once a space is selected) shows
aggregate live stats: active population, applications awaiting review,
upcoming activities, connections made. Connection count is computed via
a `security definer` SQL function (`count_space_connections`) rather
than granting operators raw `SELECT` on `connections` — operators get
a number, never who-connected-with-whom, preserving the
aggregate-not-individual-data principle. **People tab** lists everyone
currently present, searchable by name/role/domain.

**Opportunity cards are now full listings, not plain text.** Banner
image, a colored type badge, the actual description field (existed in
the schema since section 18 but was never rendered until now),
structured key-details rows (location/eligibility/compensation/
deadline), and a real clickable apply link when `application_method`
is a URL. Applies to every opportunity type uniformly, not
special-cased per type.

**Real image upload pipeline** (Supabase Storage, bucket
`toruok-media`): a file picker uploads directly from an operator's
device, gets a public URL, and populates the image field — no manual
URL-pasting required (though it's kept as a fallback). Built generic
from the start — one bucket, one `uploadImageToStorage()` helper in
`operator/page.tsx`. Upload is restricted to real authenticated
operators (blocked for anonymous participant sessions); public read
so images display to anyone; delete restricted to the uploader's own
files.

**Resources and Activities now get the same rich treatment as
Opportunities** — banner image (using the same upload pipeline),
description, structured details. Resources show
location/availability/capacity; Activities show a category badge,
when/location/capacity, and a clickable Register link when
`registration_link` is set. "Location" resolves to a real room name
via a join to `zones`, not a raw ID.

**Onboarding is self-serve but approval-gated**: anyone can sign up and
build out an organization/space/content immediately, but it stays
invisible to participants (public SELECT policies check
`organizations.approved = true`) until manually approved. No admin UI
for this yet — approval is a direct SQL update
(`update organizations set approved = true where id = '...'`),
deliberately, since review volume is low enough that a dashboard isn't
worth building yet.

## Build order (from the original planning pass)

1. ✅ Clean up inherited Oreeti scaffolding
2. ✅ Formalize the data model
3. ✅ Space/zone scoping
4. ✅ Structured Need/Offer
5. ⬜ Relevance/matching function (need↔offer, then reciprocity)
6. ✅ Ranked matches surfaced in guest UI (basic — real ranking is
   still step 5's job)
7. ✅ Operator dashboard (content authoring — analytics still ⬜)
8. ⬜ Pilot in one real space end-to-end

Chat and real auth were added mid-sequence, ahead of the original
order, because chat's privacy correctness turned out to depend on real
auth existing — not a deviation, a dependency that surfaced once chat
was built.
