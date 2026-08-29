# Toruok Space — Project Log

Running record of what this is, what's been decided, and what's actually
built. Updated as part of every change, not written once and forgotten.

## What this is

A human opportunity engine for physical spaces — schools, hotels,
libraries, cafés, coworking spaces, universities. Not a networking or
presence app: the point isn't "people are nearby," it's "here's an
opportunity — a person, a resource, a scheduled activity — relevant to
what you need or can offer, in the space you're actually in right now."

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
- Operator dashboard has no aggregated analytics yet (presence counts,
  match/handshake rates) — only content authoring (Opportunities,
  Resources, Activities) and space creation exist so far.

## Operator side (`/operator`)

Separate route, separate auth: operators sign in with **magic-link
email** (persistent identity, since they return to manage a space over
time — unlike participants, who are anonymous walk-ins by design). An
operator creates one Organization, then one or more Spaces under it,
then authors Opportunities/Resources/Activities into a given Space.
The participant link for a space (`/?space=<id>`) is shown directly in
the dashboard once a space is selected.

Ownership is enforced via `organizations.owner_id` and RLS policies
that check space/content ownership through a join back to the owning
organization — public read stays open on all of it (so Discover still
works), only writes are restricted to the owner.

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
