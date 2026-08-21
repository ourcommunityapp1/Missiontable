-- Mission Table — Meals attendance, From the Field posts
-- Run this in your Supabase SQL editor (this repo's migrations are documentation,
-- not auto-applied — see the note at the bottom of 001_initial_schema.sql).

-- ============================================================
-- KITS: optional recipe/meal photo (additive column, no rename)
-- ============================================================

alter table kits add column if not exists photo_url text;

-- ============================================================
-- KIT_ATTENDANCE — self-reported "I gathered" per member per kit
-- ============================================================

create table kit_attendance (
  id           uuid primary key default gen_random_uuid(),
  kit_id       uuid not null references kits(id),
  member_id    uuid not null references members(id),
  gathered_at  timestamptz not null default now(),

  unique (kit_id, member_id)
);

alter table kit_attendance enable row level security;

create policy "Kit attendance is publicly readable"
  on kit_attendance for select
  using (true);

create policy "Anyone can mark attendance"
  on kit_attendance for insert
  with check (true);

create policy "Anyone can remove attendance"
  on kit_attendance for delete
  using (true);

-- ============================================================
-- FIELD_POSTS — host-authored mission-partner updates
-- ============================================================

create table field_posts (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id),
  host_id       uuid not null references hosts(id),
  author_label  text not null,
  body          text not null,
  photo_url     text,
  video_url     text,
  created_at    timestamptz not null default now()
);

alter table field_posts enable row level security;

create policy "Field posts are publicly readable"
  on field_posts for select
  using (true);

create policy "Anyone can create a field post"
  on field_posts for insert
  with check (true);

-- ============================================================
-- FIELD_POST_REACTIONS — toggle-style, one per member per post
-- ============================================================

create table field_post_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references field_posts(id),
  member_id  uuid not null references members(id),
  created_at timestamptz not null default now(),

  unique (post_id, member_id)
);

alter table field_post_reactions enable row level security;

create policy "Field post reactions are publicly readable"
  on field_post_reactions for select
  using (true);

create policy "Anyone can react to a field post"
  on field_post_reactions for insert
  with check (true);

create policy "Anyone can remove their reaction"
  on field_post_reactions for delete
  using (true);

-- ============================================================
-- FIELD_POST_COMMENTS
-- ============================================================

create table field_post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references field_posts(id),
  member_id  uuid not null references members(id),
  body       text not null,
  created_at timestamptz not null default now()
);

alter table field_post_comments enable row level security;

create policy "Field post comments are publicly readable"
  on field_post_comments for select
  using (true);

create policy "Anyone can comment on a field post"
  on field_post_comments for insert
  with check (true);

create policy "Anyone can delete a field post comment"
  on field_post_comments for delete
  using (true);
-- Note: this policy is permissive (matches the rest of this app's posture — there is
-- no service-role client anywhere, so app code is what actually enforces "only your
-- own comment"). src/app/group/[id]/actions.ts's deleteFieldPostComment checks
-- comment.member_id against the caller's member_token-derived id before deleting.
