-- ============================================================
-- GROUP CHAT: one conversation per group, for members and hosts.
--
-- Reuses the empty, unused group_chat_messages table from 002:
--   * hosts can post too (host_id), so member_id becomes optional
--   * the member FK is dropped: a groups<->members path through this table
--     would make PostgREST embeds ambiguous (see 004, 007)
--   * messages are soft-deleted (deleted_at) so other people's open chats
--     see the removal on their next refresh
-- ============================================================

alter table group_chat_messages drop constraint if exists group_chat_messages_member_id_fkey;
alter table group_chat_messages drop constraint if exists group_chat_messages_group_id_fkey;
alter table group_chat_messages
  add constraint group_chat_messages_group_id_fkey foreign key (group_id) references groups(id) on delete cascade;

alter table group_chat_messages alter column member_id drop not null;
alter table group_chat_messages add column if not exists host_id uuid;
alter table group_chat_messages add column if not exists deleted_at timestamptz;
alter table group_chat_messages add column if not exists deleted_by uuid;

alter table group_chat_messages add constraint group_chat_messages_one_author
  check ((member_id is null) <> (host_id is null));
alter table group_chat_messages add constraint group_chat_messages_body_length
  check (char_length(body) between 1 and 2000);

create index if not exists group_chat_messages_group_created_idx on group_chat_messages(group_id, created_at desc);
create index if not exists group_chat_messages_group_deleted_idx on group_chat_messages(group_id, deleted_at) where deleted_at is not null;

-- When each reader (a member id or host id) last had the chat open, for unread badges.
create table if not exists group_chat_reads (
  group_id      uuid not null references groups(id) on delete cascade,
  reader_id     uuid not null,
  last_read_at  timestamptz not null default now(),
  primary key (group_id, reader_id)
);

-- Same posture as 007 until 005_lock_down_rls is applied
-- (the app only talks to the database from the server).
drop policy if exists "Group chat messages are publicly readable" on group_chat_messages;
drop policy if exists "Anyone can post a group chat message" on group_chat_messages;
drop policy if exists "Anyone can delete a group chat message" on group_chat_messages;
create policy "server access" on group_chat_messages for all using (true) with check (true);

alter table group_chat_reads enable row level security;
create policy "server access" on group_chat_reads for all using (true) with check (true);
