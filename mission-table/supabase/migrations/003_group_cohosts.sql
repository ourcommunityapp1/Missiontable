-- ============================================================
-- GROUP_COHOSTS — additional hosts who share a group's dashboard
-- groups.host_id remains the primary host (shown publicly).
-- Each co-host logs in with their own host_token and gets full
-- dashboard access, join-request emails, and kit copies.
-- ============================================================

create table group_cohosts (
  group_id    uuid not null references groups(id) on delete cascade,
  host_id     uuid not null references hosts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (group_id, host_id)
);

create index group_cohosts_host_id_idx on group_cohosts(host_id);

alter table group_cohosts enable row level security;

-- Readable so the server (anon key) can resolve a host's groups.
-- No insert/update/delete policies: co-hosts are added by an admin in SQL.
create policy "Group cohosts are publicly readable"
  on group_cohosts for select
  using (true);
