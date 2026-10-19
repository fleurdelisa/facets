-- Storytelling Lexicon schema.
--
-- The glossary (entries with owner_id null, plus their relations) is public and
-- only written by the service role (seed + TV Tropes import). Everything a
-- signed-in person creates — custom entries, notes, works, sightings — is
-- private to them via row level security.

create extension if not exists pg_trgm;

create type entry_layer as enum (
  'plot',       -- master plots (Booker, Polti)
  'arc',        -- emotional arcs (Vonnegut, Reagan et al.)
  'structure',  -- structures / beat sheets as a whole
  'beat',       -- a single stage of a structure
  'archetype',  -- character roles
  'trope',      -- recurring situations and conventions
  'device',     -- techniques of telling
  'motif'       -- small recurring images and elements
);

create type relation_kind as enum (
  'subtrope_of',    -- from is a narrower case of to
  'opposite_of',
  'related_to',
  'confused_with',  -- note explains the difference
  'stage_of'        -- from is a beat of the structure to
);

create type work_medium as enum (
  'show', 'film', 'book', 'anime', 'manga', 'comic', 'game', 'play', 'other'
);

create type work_status as enum ('planned', 'in_progress', 'finished', 'dropped');

-- How a work uses an entry (TV Tropes' "playing with a trope" vocabulary).
create type play_type as enum (
  'straight', 'exaggerated', 'downplayed', 'subverted', 'double_subverted',
  'inverted', 'averted', 'lampshaded', 'deconstructed', 'reconstructed',
  'parodied', 'zig_zagged'
);

create table entries (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null,
  name         text not null,
  aliases      text[] not null default '{}',
  layer        entry_layer not null,
  -- Grouping within a layer, e.g. 'Booker', 'Polti', 'Vonnegut'.
  family       text,
  -- One-line summary, always written in our own words.
  summary      text not null,
  -- Where the concept comes from (a book, a theorist).
  source_name  text,
  source_url   text,
  -- Longer description. Hand-written when description_source is null;
  -- otherwise imported, with attribution kept alongside it.
  description          text,
  description_source   text,
  description_url      text,
  description_license  text,
  -- TV Tropes page path, e.g. 'Main/ChekhovsGun'. Used by the importer.
  tvtropes     text,
  -- Arcs only: fortune over time, values in [-1, 1].
  arc_points   real[],
  owner_id     uuid references auth.users (id) on delete cascade,
  search_text  text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Glossary slugs are unique; custom entries are unique per owner.
create unique index entries_glossary_slug on entries (slug) where owner_id is null;
create unique index entries_owner_slug on entries (owner_id, slug) where owner_id is not null;
create index entries_layer on entries (layer);
create index entries_search_trgm on entries using gin (search_text gin_trgm_ops);
create index entries_search_fts on entries using gin (to_tsvector('english', search_text));

create function entries_maintain() returns trigger language plpgsql as $$
begin
  new.search_text := lower(concat_ws(' ', new.name, array_to_string(new.aliases, ' '), new.summary));
  new.updated_at := now();
  return new;
end $$;

create trigger entries_maintain before insert or update on entries
  for each row execute function entries_maintain();

create table entry_relations (
  from_id     uuid not null references entries (id) on delete cascade,
  to_id       uuid not null references entries (id) on delete cascade,
  kind        relation_kind not null,
  note        text,
  -- stage_of only: order within the structure, and the rough share of the
  -- story the beat covers (0 = start, 1 = end) for the comparison view.
  position    int,
  story_start real,
  story_end   real,
  primary key (from_id, to_id, kind),
  check (from_id <> to_id)
);

create index entry_relations_to on entry_relations (to_id);

create table entry_notes (
  owner_id   uuid not null references auth.users (id) on delete cascade default auth.uid(),
  entry_id   uuid not null references entries (id) on delete cascade,
  body       text not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, entry_id)
);

create table works (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title      text not null,
  medium     work_medium not null default 'show',
  year       int,
  status     work_status not null default 'in_progress',
  notes      text,
  created_at timestamptz not null default now()
);

create index works_owner on works (owner_id, created_at desc);

create table sightings (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade default auth.uid(),
  work_id    uuid not null references works (id) on delete cascade,
  entry_id   uuid not null references entries (id) on delete cascade,
  -- Free-form: 'S2E5', 'ch. 12', '1:14:30'.
  location   text,
  play       play_type not null default 'straight',
  note       text,
  spoiler    boolean not null default false,
  created_at timestamptz not null default now()
);

create index sightings_work on sightings (work_id);
create index sightings_entry on sightings (owner_id, entry_id);

-- Ranked search over the entries the caller can see. Combines full-text rank
-- with trigram word similarity so typos ("chekov") still match.
create function search_entries(q text, max_results int default 20)
returns setof entries
language sql stable
set pg_trgm.word_similarity_threshold = 0.45
as $$
  select e.*
  from entries e
  where q <> ''
    and (lower(q) <% e.search_text
         or e.search_text like '%' || lower(q) || '%'
         or to_tsvector('english', e.search_text) @@ websearch_to_tsquery('english', q))
  order by
    (regexp_replace(lower(e.name), '^the ', '') = regexp_replace(lower(q), '^the ', '')) desc,
    (lower(e.name) like '%' || lower(q) || '%') desc,
    word_similarity(lower(q), lower(e.name)) desc,
    ts_rank(to_tsvector('english', e.search_text), websearch_to_tsquery('english', q))
      + word_similarity(lower(q), e.search_text) desc,
    e.name
  limit max_results
$$;

-- Upserts the public glossary from the seed data in one transaction. Entries
-- are matched by slug; imported descriptions survive a re-seed. Relations
-- between glossary entries are replaced wholesale. Service role only.
create function seed_glossary(entries_in jsonb, relations_in jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into entries (slug, name, aliases, layer, family, summary, description,
                       source_name, source_url, tvtropes, arc_points)
  select e.slug, e.name, coalesce(e.aliases, '{}'), e.layer, e.family, e.summary,
         e.description, e.source, e."sourceUrl", e.tvtropes, e.arc
  from jsonb_to_recordset(entries_in) as e(
    slug text, name text, aliases text[], layer entry_layer, family text, summary text,
    description text, source text, "sourceUrl" text, tvtropes text, arc real[])
  on conflict (slug) where owner_id is null do update set
    name = excluded.name,
    aliases = excluded.aliases,
    layer = excluded.layer,
    family = excluded.family,
    summary = excluded.summary,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    tvtropes = excluded.tvtropes,
    arc_points = excluded.arc_points,
    -- A hand-written description replaces whatever was there; otherwise keep
    -- the existing (imported) one.
    description = coalesce(excluded.description, entries.description),
    description_source = case when excluded.description is not null then null else entries.description_source end,
    description_url = case when excluded.description is not null then null else entries.description_url end,
    description_license = case when excluded.description is not null then null else entries.description_license end;

  delete from entry_relations r
  using entries f, entries t
  where r.from_id = f.id and r.to_id = t.id and f.owner_id is null and t.owner_id is null;

  insert into entry_relations (from_id, to_id, kind, note, position, story_start, story_end)
  select f.id, t.id, r.kind, r.note, r.position, r.start, r."end"
  from jsonb_to_recordset(relations_in) as r(
    "from" text, "to" text, kind relation_kind, note text, position int, start real, "end" real)
  join entries f on f.slug = r."from" and f.owner_id is null
  join entries t on t.slug = r."to" and t.owner_id is null;
end $$;

revoke execute on function seed_glossary(jsonb, jsonb) from public, anon, authenticated;

-- Row level security ---------------------------------------------------------

alter table entries enable row level security;
alter table entry_relations enable row level security;
alter table entry_notes enable row level security;
alter table works enable row level security;
alter table sightings enable row level security;

create policy "glossary and own entries are readable" on entries
  for select using (owner_id is null or owner_id = auth.uid());
create policy "own entries are writable" on entries
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "relations between readable entries are readable" on entry_relations
  for select using (
    exists (select 1 from entries e where e.id = from_id)
    and exists (select 1 from entries e where e.id = to_id)
  );
create policy "relations from own entries are writable" on entry_relations
  for all to authenticated
  using (exists (select 1 from entries e where e.id = from_id and e.owner_id = auth.uid()))
  with check (exists (select 1 from entries e where e.id = from_id and e.owner_id = auth.uid()));

create policy "own notes" on entry_notes
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own works" on works
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own sightings" on sightings
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from works w where w.id = work_id and w.owner_id = auth.uid())
  );
