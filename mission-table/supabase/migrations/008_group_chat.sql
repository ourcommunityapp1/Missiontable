-- ============================================================
-- GROUP CHAT: one conversation per group, for members and hosts.
--
-- Purely additive. (The empty group_chat_messages table from 002 is left
-- unused: it requires a member author, and changing it would mean dropping
-- constraints.)
--
-- member_id / host_id intentionally have no FKs: a second groups<->members
-- or groups<->hosts path would make PostgREST embeds ambiguous (see 004, 007).
-- Messages are soft-deleted (deleted_at) so other people's open chats see the
-- removal on their next refresh.
-- ============================================================

create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  member_id   uuid,
  host_id     uuid,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  deleted_by  uuid,
  constraint chat_messages_one_author check ((member_id is null) <> (host_id is null))
);
create index if not exists chat_messages_group_created_idx on chat_messages(group_id, created_at desc);
create index if not exists chat_messages_group_deleted_idx on chat_messages(group_id, deleted_at) where deleted_at is not null;

-- When each reader (a member id or host id) last had the chat open, for unread badges.
create table if not exists chat_reads (
  group_id      uuid not null references groups(id) on delete cascade,
  reader_id     uuid not null,
  last_read_at  timestamptz not null default now(),
  primary key (group_id, reader_id)
);

-- Same posture as 007 until 005_lock_down_rls is applied
-- (the app only talks to the database from the server).
alter table chat_messages enable row level security;
alter table chat_reads enable row level security;
create policy "server access" on chat_messages for all using (true) with check (true);
create policy "server access" on chat_reads for all using (true) with check (true);
