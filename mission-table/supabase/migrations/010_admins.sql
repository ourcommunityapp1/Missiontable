-- ============================================================
-- ADMINS: people who run Mission Table itself (approve new groups,
-- help hosts). Each admin gets a private dashboard link
-- /admin/<admin_token>, like hosts' /host/<host_token>.
-- Purely additive.
-- ============================================================

create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  admin_token   uuid not null unique default gen_random_uuid(),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

-- When a pending group was approved or declined, and by whom.
alter table groups add column if not exists reviewed_at timestamptz;
alter table groups add column if not exists reviewed_by uuid;

alter table admins enable row level security;
create policy "server access" on admins for all using (true) with check (true);
