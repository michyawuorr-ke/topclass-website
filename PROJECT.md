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

## Self-declare + approval

Closes the gap SSO alone couldn't: someone domain-verified via Google
who was never manually invited can now request Tier 2/3 access
themselves, instead of being stuck.

- On sign-in, if no invite/membership matched at any tier, the app
  looks for an approved organization whose `email_domain` matches the
  signed-in account's domain. If one exists, the person sees a
  **request access** screen (pick Space Admin or Zone Publisher, a
  space/zone, an optional note) instead of "set up your organization"
  — with a manual "set up a new organization instead" escape hatch,
  since a domain match isn't proof they should default into requesting.
- `access_requests` table holds the request. `approve_access_request()`
  / `deny_access_request()` are `security definer` Postgres functions,
  not raw table updates — approval atomically checks the approver is
  actually a Tier 2+ admin of that scope AND creates the real
  `space_admins`/`zone_publishers` row in the same transaction, so
  there's no window where a request is "approved" but access wasn't
  actually granted.
- Approvals surface in the **Space Team** tab as a **Pending Requests**
  section at the top, visible to whichever space admin the request is
  scoped to. One tap to approve or deny.

## Self-declare + approval

Closes the gap SSO alone couldn't: someone domain-verified via Google
who was never manually invited can now request Tier 2/3 access
themselves, instead of being stuck.

- On sign-in, if no invite/membership matched at any tier, the app
  looks for an approved organization whose `email_domain` matches the
  signed-in account's domain. If one exists, the person sees a
  **request access** screen (pick Space Admin or Zone Publisher, a
  space/zone, an optional note) instead of "set up your organization"
  — with a manual "set up a new organization instead" escape hatch,
  since a domain match isn't proof they should default into requesting.
- `access_requests` table holds the request. `approve_access_request()`
  / `deny_access_request()` are `security definer` Postgres functions,
  not raw table updates — approval atomically checks the approver is
  actually a Tier 2+ admin of that scope AND creates the real
  `space_admins`/`zone_publishers` row in the same transaction, so
  there's no window where a request is "approved" but access wasn't
  actually granted.
- Approvals surface in the **Space Team** tab as a **Pending Requests**
  section at the top, visible to whichever space admin the request is
  scoped to. One tap to approve or deny.

## Known gaps (flagged, not yet solved)

- Self-declare access requests only work for an org that already
  exists and already set `email_domain` — someone whose university
  has no org set up yet still goes through "set up your organization"
  as a new owner, since there's nothing to request access to.
  Auto-approving via a Google Admin SDK directory lookup (instead of
  a human tapping Approve) is still unbuilt and needs domain-wide
  delegation from university IT.

- Self-declare access requests only work for an org that already
  exists and already set `email_domain` — someone whose university
  has no org set up yet still goes through "set up your organization"
  as a new owner, since there's nothing to request access to.
  Auto-approving via a Google Admin SDK directory lookup (instead of
  a human tapping Approve) is still unbuilt and needs domain-wide
  delegation from university IT.

- Space admin / zone publisher invites are still manual, one at a
  time, from a **Space Team** tab inside each space. Signing in with
  Google (added on top of magic link in `AuthGate`) is what actually
  claims those invites now, and an org can set `email_domain` (e.g.
  `university.ac.ke`) to require the claiming Google account be on
  that domain — that's the real "official email domain
  authentication" piece. Still missing: auto-*creating*
  space_admin/zone_publisher rows for someone who was never manually
  invited at all (true zero-touch provisioning from a role/department
  claim). Google Workspace OAuth doesn't hand you that claim — closing
  this needs either a self-declare + one-tap operator approval flow,
  or a Google Admin SDK directory lookup (needs domain-wide delegation
  from university IT, not just code).

- Manual step, not code: Google has to be enabled as an OAuth provider
  in the Supabase dashboard (Authentication > Providers > Google)
  using a Google Cloud OAuth client, once per project. No migration
  covers this.

- **Fixed but worth remembering the pattern**: organization creation
  silently failed for a while — the RLS policy checked "does this org
  already exist and do you own it," which can never be true for a
  brand-new org. Split into a plain ownership check for INSERT.
  Every operator create action (org, space, zone, opportunity,
  resource, activity, team invite) now surfaces the real error message
  via `window.alert()` instead of failing silently — this class of bug
  should never again look like "the button just doesn't work."

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

## Entry flow (`src/app/entry/`)

A real configuration engine for how a participant enters a space —
built independently, then integrated into the current modular
structure rather than replacing it. Per environment type (currently
University, Innovation Hub — Hotel/Coworking/Custom configs exist in
code but aren't exposed in the operator's space-creation dropdown,
per the deliberate vertical-narrowing decision), it defines: which
auth methods are offered (anonymous / email magic link / phone OTP /
institutional / invite code — only the *first* listed method per
config actually renders as a working form right now; selecting a
secondary method sets state but doesn't switch the UI — a real bug in
the uploaded component, not yet fixed), which profile fields to
collect and in what order, which presence fields to ask for, and what
roles exist with their own visibility/permission defaults. Config
resolves org-level, then space-level JSON overrides on top of the
vertical default — `useEntryConfig` handles the merge.

`EntryFlowGate` in `page.tsx` renders `EntryFlow` until entry
completes; `useIdentity` no longer auto-signs anyone in or manages the
entry sequence itself — it just holds profile state and exposes
`hydrateFromEntry()`, which `EntryFlow`'s completion callback feeds
directly (no redundant re-fetch from the DB).

Known gaps: the secondary-auth-method button bug above; `invite_code`
auth (Innovation Hub's third option) has no backing `invite_codes`
table yet — not currently reachable anyway because of that same bug,
so not blocking; `phone_otp` needs a configured SMS provider in
Supabase before it would work even if reachable.

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

## Spaces & Teams (department/team architecture)

Split "Zones" into two genuinely separate tracks, per the Spaces &
Teams spec: **physical** zones (rooms/buildings — unchanged table,
gained a `building_tag`) generate door QR codes for check-in;
**operational** teams (departments/crews — new `teams` table) own
schedules, operator invites, scoped opportunities, live roster, and
announcements. A team can point at a home zone but is not a renamed
zone.

New tables: `teams`, `team_leads` (HOD), `team_operators`
(lecturer/TA), `schedules`, `announcements`. `opportunities` gained
`team_id`. `spaces` gained `space_code`/`domain_restriction`; `zones`
gained `building_tag`. Cascading RLS via `is_team_lead()` /
`can_operate_team()`, same pattern as `is_space_admin()`. A
`redeem_team_join_code()` function lets lecturers/TAs self-onboard
with a 6-digit code instead of waiting on an email invite.

Super Admin's Space Creation Drawer now writes space code + domain
binding, and auto-invites the dean/lead as `space_admins` on
creation. Master Space Directory shows lead, active zone count, and
status. Space Admin's old "Team" tab (access-control invites) was
renamed to **Admins** to free up "Teams" for the new department
concept, which now has its own tab with a full department workspace
(Overview/Schedule/Lecturers-TAs/Opportunities/Roster/Notices). A new
`team_lead` role tier routes HODs to their own dashboard
(`TeamLeadView`, mirrors `ZoneOperatorView`'s pattern) — plain
lecturers/TAs don't have a routed dashboard yet, just working
invite/join-code rows.

Deliberately deferred:
- No true schedule-time-window attendance log yet. "Live roster"
  reads `presence.zone_id` against the team's `primary_zone_id` —
  real, but not correlated against a specific scheduled slot.
- Room door QR codes encode `${origin}/?space=<id>&zone=<id>`, but
  `EntryFlow` doesn't consume the `zone` param yet — scanning one
  today just enters the space, not the room. Printing them now is
  still useful; wiring participant auto-set-zone-on-scan is a
  follow-up.
- No routed dashboard for plain team_operators (non-lead
  lecturers/TAs) — a lighter operator-only view is a natural next
  step once there's demand for it.

## Departments/Buildings restyle (superseding the section above)

Rebuilt the Space Admin and HOD dashboards around a simpler mental
model, replacing the Zones/Teams tabs from the previous pass:

- **Space Admin** tabs are now Home / Departments / Buildings /
  Publish / Applications. Departments are academic-only (the UI no
  longer offers "crew"), created with name/description/capacity/
  building, then opened afterward to invite the HOD as a separate
  step. Buildings are a thin CRUD over top-level `zones` rows
  (name + `building_tag` only) that departments reference by
  dropdown via `primary_zone_id`. Publish merged Opportunities/
  Activities/Resources into one tab with sub-tabs, all authored
  through bottom-sheet Drawers instead of inline forms — this
  content is space-wide (`team_id is null`), separate from what a
  department publishes itself.
- **HOD dashboard** was rebuilt as `HODView` (replacing
  `TeamLeadView`, now deleted) with its own Home/Rooms/Schedules/
  Publish/Applications/Notices tabs, same Drawer pattern. "Rooms"
  are child `zones` of the department's building
  (`parent_zone_id` = the department's `primary_zone_id`) — each
  gets a door QR code, generated the same way the old ZonesPanel did.
  Department-scoped opportunities/activities/resources use `team_id`.
- Old `TeamsPanel`/`TeamWorkspace`/`ZonesPanel`/`SpaceTeamPanel`/
  `TeamPanel`/`SpacesList` components deleted as dead code —
  nothing referenced them after the rebuild. Space-admin delegation
  (inviting co-admins) and pending access-request approval, which
  used to live in a dedicated Admins tab, now live in a compact
  section on Home instead — dropping that tab was implied by the
  new 5-tab spec but the underlying capability still needed a home.
- Schema additions: `teams.capacity`, `resources.team_id`,
  `activities.team_id` (opportunities already had it), with RLS
  extended the same way opportunities' was
  (`can_operate_team(team_id)` added to each "Owner manage" policy).
- Also fixed, in a prior untracked pass: RLS recursion on
  `organization_members`' SELECT policy (was querying itself) that
  broke team invites, space creation, and space_admin insert/delete
  — rewritten to go through `is_org_member()` (security definer,
  bypasses RLS) everywhere.

Deliberately still deferred: true schedule-window attendance
correlation, and room-QR-scan auto-entering the room (still just
enters the space — see prior section, unchanged).



