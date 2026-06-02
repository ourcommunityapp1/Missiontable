-- Mission Table — Initial Schema
-- Run this in your Supabase SQL editor or via the Supabase CLI

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type host_type as enum ('individual', 'church', 'organization');
create type group_type as enum ('in-person', 'virtual');
create type rhythm_type as enum ('date_of_month', 'day_of_week_pattern');
create type group_status as enum ('active', 'full', 'inactive');
create type membership_status as enum ('pending', 'accepted', 'declined');

-- ============================================================
-- HOSTS
-- ============================================================

create table hosts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null unique,
  phone          text,
  host_type      host_type not null,
  auth_user_id   uuid,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- GROUPS
-- ============================================================

create table groups (
  id              uuid primary key default gen_random_uuid(),
  country_slug    text not null,
  host_id         uuid not null references hosts(id),
  group_type      group_type not null,
  city            text,
  state           text,
  rhythm_type     rhythm_type not null,
  day_of_month    integer check (day_of_month between 1 and 28),
  week_of_month   integer check (week_of_month between 1 and 4),
  day_of_week     text,
  meeting_time    time not null,
  timezone        text not null,
  max_size        integer,
  status          group_status not null default 'active',
  start_date      date not null,
  end_date        date not null,
  created_at      timestamptz not null default now(),

  -- Rhythm field rules
  constraint rhythm_date_of_month check (
    rhythm_type != 'date_of_month' or day_of_month is not null
  ),
  constraint rhythm_day_of_week_pattern check (
    rhythm_type != 'day_of_week_pattern' or (week_of_month is not null and day_of_week is not null)
  ),
  -- In-person groups must have a city
  constraint in_person_requires_city check (
    group_type != 'in-person' or city is not null
  )
);

-- ============================================================
-- MEMBERS
-- ============================================================

create table members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null unique,
  phone        text,
  auth_user_id uuid,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- MEMBERSHIPS
-- ============================================================

create table memberships (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references groups(id),
  member_id    uuid not null references members(id),
  status       membership_status not null default 'pending',
  requested_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (group_id, member_id)
);

-- Auto-update updated_at on memberships
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger memberships_updated_at
  before update on memberships
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (basic — tighten when auth is added)
-- ============================================================

alter table hosts enable row level security;
alter table groups enable row level security;
alter table members enable row level security;
alter table memberships enable row level security;

-- Public can read active groups (needed for country page)
create policy "Groups are publicly readable"
  on groups for select
  using (status != 'inactive');

-- Public can read hosts (needed to show host name on group cards)
create policy "Hosts are publicly readable"
  on hosts for select
  using (true);

-- Anyone can insert a host (start a group flow — no auth yet)
create policy "Anyone can create a host"
  on hosts for insert
  with check (true);

-- Anyone can insert a group (start a group flow — no auth yet)
create policy "Anyone can create a group"
  on groups for insert
  with check (true);

-- Anyone can insert a member (join a group flow — no auth yet)
create policy "Anyone can create a member"
  on members for insert
  with check (true);

-- Anyone can insert a membership (join a group flow — no auth yet)
create policy "Anyone can create a membership"
  on memberships for insert
  with check (true);
