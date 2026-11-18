-- Lock the database down to the server.
--
-- The app talks to Supabase only from the server (src/lib/supabase.ts is
-- server-only) using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. The public
-- anon/publishable key therefore needs no access at all. Before this migration,
-- anyone holding that key could read every host token, member email and phone,
-- and update hosts, groups, kits, members and memberships.
--
-- PREREQUISITE: SUPABASE_SERVICE_ROLE_KEY must be set in Netlify and deployed,
-- or the site loses database access. Roll back with 005_lock_down_rls.down.sql.

do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('hosts','groups','group_cohosts','members','memberships','kits',
                        'kit_attendance','field_posts','field_post_reactions',
                        'field_post_comments','group_chat_messages',
                        'group_page_views','gathering_rsvps','host_notes','gathering_sends',
                        'table_posts','meal_invites','meal_invite_guests',
                        'group_chat_reads')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- RLS stays enabled on every table; with no policies, anon and authenticated
-- roles are denied. The service role bypasses RLS.

-- Storage: table photos are uploaded and deleted only by the server (service role).
drop policy if exists "server uploads table photos" on storage.objects;
drop policy if exists "server deletes table photos" on storage.objects;
