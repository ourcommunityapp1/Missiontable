-- ============================================================
-- GATHERING LOOP: RSVPs, host notes, automatic emails, table posts,
-- and "eat together" invitations between members.
--
-- member_id columns intentionally have no FK to members: a second
-- groups<->members relationship would make PostgREST embeds ambiguous
-- (see 004). Integrity is enforced in the server actions.
-- ============================================================

-- Host opt-in for automatic "Are you in?" / thank-you emails.
alter table groups add column if not exists auto_messages boolean not null default false;

-- "Are you in?" answers, one per member per gathering date.
create table gathering_rsvps (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  member_id     uuid not null,
  meeting_date  date not null,
  status        text not null check (status in ('in', 'out')),
  responded_at  timestamptz not null default now(),
  unique (group_id, member_id, meeting_date)
);
create index gathering_rsvps_group_date_idx on gathering_rsvps(group_id, meeting_date);

-- Notes the host writes for each gathering, in their own voice.
-- kind: 'rsvp' (3 days before) or 'thanks' (day after).
-- skip = true means "don't send anything for this one".
create table host_notes (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  meeting_date  date not null,
  kind          text not null check (kind in ('rsvp', 'thanks')),
  body          text,
  skip          boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique (group_id, meeting_date, kind)
);

-- Log of automatic sends so each one goes out once.
-- kind: 'rsvp', 'thanks', 'host_reminder_rsvp', 'host_reminder_thanks'.
create table gathering_sends (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  meeting_date  date not null,
  kind          text not null,
  recipients    integer not null default 0,
  sent_at       timestamptz not null default now(),
  unique (group_id, meeting_date, kind)
);

-- A member's table photo and one line of prayer for a gathering.
create table table_posts (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  member_id     uuid not null,
  meeting_date  date not null,
  photo_path    text,
  prayer        text,
  created_at    timestamptz not null default now(),
  unique (group_id, member_id, meeting_date)
);
create index table_posts_group_date_idx on table_posts(group_id, meeting_date);

-- A member inviting others from their group to eat together.
create table meal_invites (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references groups(id) on delete cascade,
  inviter_member_id uuid not null,
  meeting_date      date not null,
  place_type        text not null check (place_type in ('home', 'restaurant')),
  place_name        text,
  address_line      text,
  city              text,
  state             text,
  zip               text,
  arrive_time       text,
  food              text check (food in ('cook', 'potluck', 'order')),
  seats             integer,
  note              text,
  created_at        timestamptz not null default now(),
  cancelled_at      timestamptz
);
create index meal_invites_group_date_idx on meal_invites(group_id, meeting_date);

create table meal_invite_guests (
  id            uuid primary key default gen_random_uuid(),
  invite_id     uuid not null references meal_invites(id) on delete cascade,
  member_id     uuid not null,
  status        text not null default 'invited' check (status in ('invited', 'accepted', 'declined')),
  responded_at  timestamptz,
  seen_at       timestamptz,
  unique (invite_id, member_id)
);
create index meal_invite_guests_member_idx on meal_invite_guests(member_id);

-- Same posture as the rest of the schema until 005_lock_down_rls is applied
-- (the app only talks to the database from the server).
alter table gathering_rsvps enable row level security;
alter table host_notes enable row level security;
alter table gathering_sends enable row level security;
alter table table_posts enable row level security;
alter table meal_invites enable row level security;
alter table meal_invite_guests enable row level security;

create policy "server access" on gathering_rsvps for all using (true) with check (true);
create policy "server access" on host_notes for all using (true) with check (true);
create policy "server access" on gathering_sends for all using (true) with check (true);
create policy "server access" on table_posts for all using (true) with check (true);
create policy "server access" on meal_invites for all using (true) with check (true);
create policy "server access" on meal_invite_guests for all using (true) with check (true);

-- Table photos. Public-read bucket with unguessable paths
-- (<group_id>/<uuid>.jpg); uploads only happen from the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('table-photos', 'table-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "server uploads table photos" on storage.objects
  for insert with check (bucket_id = 'table-photos');
create policy "server deletes table photos" on storage.objects
  for delete using (bucket_id = 'table-photos');
