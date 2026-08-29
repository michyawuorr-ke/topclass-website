# Migration history

These files are the historical record of every schema change applied
to this project, in order. They were reconstructed retroactively from
the build session that created them (this repo doesn't use the
Supabase CLI to auto-generate migrations yet — these are applied
manually via the Supabase SQL Editor).

From this point forward: every new schema change gets both a new file
here (for history) AND a standalone .sql handed over to run in the
SQL Editor (since that's the actual apply mechanism). The naming
pattern is `YYYYMMDDHHMMSS_short_description.sql`, matching what the
Supabase CLI itself expects, so this folder is ready to use with
`supabase db push` later if a CLI workflow gets set up.

