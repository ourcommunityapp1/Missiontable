-- Mission Table: discovery metrics (READ-ONLY).
-- Run each query with the Supabase execute_sql tool. Aggregates only: never
-- copy names, emails or tokens into the repo (it is public).
-- "Live groups" = status active or full (excludes pending and inactive).
-- The hidden QA group 488ee5be-5a52-432d-981e-69488f519a8d is test data: exclude it everywhere.

-- Q1. Groups by status, and members per live group
select g.status, count(*) as groups,
       coalesce(sum((select count(*) from memberships m where m.group_id = g.id and m.status = 'accepted')), 0) as accepted_members
from groups g where g.id <> '488ee5be-5a52-432d-981e-69488f519a8d' group by g.status order by g.status;

-- Q2. Join funnel, last 90 days: requests -> accepted / declined / still pending (live groups)
select date_trunc('month', m.requested_at)::date as month,
       count(*) as requests,
       count(*) filter (where m.status = 'accepted') as accepted,
       count(*) filter (where m.status = 'declined') as declined,
       count(*) filter (where m.status = 'pending') as pending,
       round(avg(extract(epoch from (m.updated_at - m.requested_at)) / 3600) filter (where m.status <> 'pending')::numeric, 1) as avg_hours_to_answer
from memberships m join groups g on g.id = m.group_id
where g.status in ('active','full') and m.requested_at > now() - interval '90 days'
group by 1 order by 1;

-- Q3. Members who opened their group page, by week (tracking began 2026-11-17)
select date_trunc('week', v.viewed_at)::date as week,
       count(distinct v.member_id) as members_visiting, count(*) as visits
from group_page_views v join groups g on g.id = v.group_id
where g.status in ('active','full')
group by 1 order by 1 desc limit 12;

-- Q4. Share of members active in the last 30 days, per live group (anonymised by country)
select g.country_slug,
       (select count(*) from memberships m where m.group_id = g.id and m.status = 'accepted') as members,
       count(distinct v.member_id) filter (where v.viewed_at > now() - interval '30 days') as active_30d
from groups g left join group_page_views v on v.group_id = g.id
where g.status in ('active','full') group by g.id, g.country_slug order by members desc;

-- Q5. "Are you in?" per gathering: answers and share of members
select g.country_slug, r.meeting_date,
       count(*) filter (where r.status = 'in') as in_count,
       count(*) filter (where r.status = 'out') as out_count,
       (select count(*) from memberships m where m.group_id = g.id and m.status = 'accepted') as members
from gathering_rsvps r join groups g on g.id = r.group_id
where g.status in ('active','full') group by g.country_slug, g.id, r.meeting_date order by r.meeting_date desc limit 12;

-- Q6. After the gathering: "we gathered" marks and table posts per meal
select g.country_slug, k.meeting_date, k.recipe_name is not null as has_recipe,
       (select count(*) from kit_attendance a where a.kit_id = k.id) as gathered_marks,
       (select count(*) from table_posts t where t.group_id = g.id and t.meeting_date = k.meeting_date) as table_posts
from kits k join groups g on g.id = k.group_id
where g.status in ('active','full') order by k.meeting_date desc limit 12;

-- Q7. Field updates and the response to them
select g.country_slug, date_trunc('month', p.created_at)::date as month, count(distinct p.id) as posts,
       count(distinct r.id) as praying_reactions, count(distinct c.id) as comments,
       count(*) filter (where p.video_url is not null) > 0 as has_video
from field_posts p join groups g on g.id = p.group_id
left join field_post_reactions r on r.post_id = p.id
left join field_post_comments c on c.post_id = p.id
where g.status in ('active','full') group by 1, 2 order by 2 desc;

-- Q8. Chat: messages per week and distinct people posting (members vs hosts)
select date_trunc('week', c.created_at)::date as week, count(*) as messages,
       count(distinct c.member_id) as members_posting, count(distinct c.host_id) as hosts_posting
from chat_messages c join groups g on g.id = c.group_id
where g.status in ('active','full') and c.deleted_at is null group by 1 order by 1 desc limit 12;

-- Q9. Eat together: invitations and responses
select date_trunc('month', i.created_at)::date as month, count(distinct i.id) as invitations,
       count(gst.id) as guests_invited,
       count(gst.id) filter (where gst.status = 'accepted') as accepted,
       count(gst.id) filter (where gst.status = 'declined') as declined
from meal_invites i join groups g on g.id = i.group_id
left join meal_invite_guests gst on gst.invite_id = i.id
where g.status in ('active','full') and i.cancelled_at is null group by 1 order by 1 desc;

-- Q10. Home-screen app: members who opened the installed app, per live group
select g.country_slug,
       (select count(*) from memberships m where m.group_id = g.id and m.status = 'accepted') as members,
       count(o.member_id) as with_app, coalesce(sum(o.opens), 0) as app_opens
from groups g left join member_app_opens o on o.group_id = g.id
where g.status in ('active','full') group by g.id, g.country_slug;

-- Q11. Automatic emails and host notes: what went out, per live group
select g.country_slug, s.kind, count(*) as sends, sum(s.recipients) as recipients, max(s.sent_at)::date as last_sent,
       bool_or(g.auto_messages) as auto_messages_on
from gathering_sends s join groups g on g.id = s.group_id
where g.status in ('active','full') group by g.country_slug, s.kind order by g.country_slug, s.kind;

-- Q12. Supply side: groups started per month, and how many are pending review
select date_trunc('month', created_at)::date as month, count(*) as groups_started,
       count(*) filter (where status = 'pending') as still_pending
from groups where id <> '488ee5be-5a52-432d-981e-69488f519a8d' group by 1 order by 1 desc limit 12;
