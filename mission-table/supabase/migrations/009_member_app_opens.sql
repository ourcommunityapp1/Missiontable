-- ============================================================
-- MEMBER APP OPENS: one row per member per group, updated each time the
-- member opens the group from their home screen (the installed web app).
-- Lets hosts see who has the app and email only those who don't.
--
-- Purely additive. member_id has no FK on purpose (see 004, 007).
-- ============================================================

create table if not exists member_app_opens (
  group_id         uuid not null references groups(id) on delete cascade,
  member_id        uuid not null,
  first_opened_at  timestamptz not null default now(),
  last_opened_at   timestamptz not null default now(),
  opens            integer not null default 1,
  platform         text,
  primary key (group_id, member_id)
);

alter table member_app_opens enable row level security;
create policy "server access" on member_app_opens for all using (true) with check (true);
