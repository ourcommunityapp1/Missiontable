-- GROUP_PAGE_VIEWS — one row each time a member opens their group page via
-- their member link. Powers the "Activity" section on the host dashboard.
-- No FK on member_id on purpose: a second groups<->members relationship would
-- make PostgREST embeds ambiguous (see 004).
create table group_page_views (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  member_id  uuid not null,
  viewed_at  timestamptz not null default now()
);

create index group_page_views_group_viewed_idx on group_page_views(group_id, viewed_at);

alter table group_page_views enable row level security;

-- Same posture as the other tables until 005_lock_down_rls is applied
-- (005 drops these along with the rest).
create policy "Anyone can record a group page view" on group_page_views for insert with check (true);
create policy "Group page views are readable" on group_page_views for select using (true);
