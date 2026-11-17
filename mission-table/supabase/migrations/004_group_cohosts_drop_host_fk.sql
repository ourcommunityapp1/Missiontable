-- 003 added group_cohosts.host_id -> hosts(id). That gave PostgREST two
-- relationships between groups and hosts, so every unqualified `hosts (...)`
-- embed on groups failed with PGRST201 (group, join and country pages broke).
-- Queries now name the FK explicitly (hosts!groups_host_id_fkey), but the
-- constraint was dropped in production as the immediate fix; keep it dropped.
alter table group_cohosts drop constraint if exists group_cohosts_host_id_fkey;
