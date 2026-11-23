import 'server-only';
import { supabase } from './supabase';
import { esc } from './escapeHtml';
import { SITE_URL, sendEmail, gatheringOnOrAfter, gatheringBefore, localNow } from './gathering';
import { countries } from '@/data/countries';

// Mission Table admins run the platform: approve new groups, help hosts.
// Each has a private dashboard link /admin/<admin_token>.

/** The hidden QA test group (kept 'pending' so it's never listed). Never shown as real work. */
export const QA_GROUP_ID = '488ee5be-5a52-432d-981e-69488f519a8d';

/** Where admin notices go if no admin is set up (and the address hosts can write to). */
export const ADMIN_INBOX = 'projectmissiontable@gmail.com';

export type Admin = { id: string; name: string; email: string; admin_token: string; active: boolean; created_at: string; last_seen_at: string | null };

const UUID = /^[0-9a-f-]{36}$/i;

export async function getAdminByToken(token: string): Promise<Admin | null> {
  if (!token || !UUID.test(token)) return null;
  const { data } = await supabase
    .from('admins')
    .select('id, name, email, admin_token, active, created_at, last_seen_at')
    .eq('admin_token', token)
    .eq('active', true)
    .maybeSingle() as unknown as { data: Admin | null };
  return data;
}

export async function touchAdmin(id: string): Promise<void> {
  await supabase.from('admins').update({ last_seen_at: new Date().toISOString() }).eq('id', id);
}

export async function listAdmins(): Promise<Admin[]> {
  const { data } = await supabase
    .from('admins')
    .select('id, name, email, admin_token, active, created_at, last_seen_at')
    .order('created_at', { ascending: true }) as unknown as { data: Admin[] | null };
  return data ?? [];
}

/** Sends a notice to every active admin, each with their own dashboard link. Returns how many went out. */
export async function notifyAdmins(subject: string, html: (dashboardUrl: string) => string): Promise<number> {
  const admins = (await listAdmins()).filter((a) => a.active);
  if (admins.length === 0) {
    return (await sendEmail({ to: ADMIN_INBOX, subject, html: html(`${SITE_URL}/`) })) ? 1 : 0;
  }
  let sent = 0;
  for (const a of admins) {
    if (await sendEmail({ to: a.email, subject, html: html(`${SITE_URL}/admin/${a.admin_token}`) })) sent++;
  }
  return sent;
}

// ─── The overview ─────────────────────────────────────────────────────────────

export type AdminGroup = {
  id: string;
  name: string;
  countrySlug: string;
  countryName: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  host: { name: string; email: string; token: string } | null;
  members: number;
  waitingRequests: number;
  oldestWaitingAt: string | null;
  lastMeal: { meetingDate: string; sentAt: string } | null;
  nextGathering: string | null;
  nextMealSent: boolean;
  missedMeals: number; // of the last 3 gatherings, how many had no meal
  autoMessages: boolean;
  withApp: number;
  isTest: boolean;
};

export type Attention = { key: string; kind: 'pending_group' | 'waiting_requests' | 'meal_due' | 'stalled'; groupId: string; title: string; detail: string; urgent: boolean };

type Row = {
  id: string; name: string | null; country_slug: string; status: string; created_at: string; reviewed_at: string | null;
  host_id: string; timezone: string; auto_messages: boolean; start_date: string;
  rhythm_type: string; day_of_month: number | null; week_of_month: number | null; day_of_week: string | null;
};

const daysSince = (iso: string) => Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
const dayDiff = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
const short = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export async function getAdminOverview(): Promise<{ groups: AdminGroup[]; attention: Attention[] }> {
  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name, country_slug, status, created_at, reviewed_at, host_id, timezone, auto_messages, start_date, rhythm_type, day_of_month, week_of_month, day_of_week')
    .order('created_at', { ascending: true }) as unknown as { data: Row[] | null };
  const rows = groupRows ?? [];
  if (rows.length === 0) return { groups: [], attention: [] };
  const ids = rows.map((r) => r.id);

  const [hostsRes, membershipsRes, kitsRes, opensRes] = await Promise.all([
    supabase.from('hosts').select('id, name, email, host_token').in('id', [...new Set(rows.map((r) => r.host_id))]),
    supabase.from('memberships').select('group_id, status, requested_at').in('group_id', ids),
    supabase.from('kits').select('group_id, meeting_date, created_at').in('group_id', ids).order('meeting_date', { ascending: false }),
    supabase.from('member_app_opens').select('group_id').in('group_id', ids),
  ]) as unknown as [
    { data: { id: string; name: string; email: string; host_token: string }[] | null },
    { data: { group_id: string; status: string; requested_at: string }[] | null },
    { data: { group_id: string; meeting_date: string; created_at: string }[] | null },
    { data: { group_id: string }[] | null },
  ];
  const hosts = new Map((hostsRes.data ?? []).map((h) => [h.id, h]));
  const memberships = membershipsRes.data ?? [];
  const kits = kitsRes.data ?? [];
  const opens = opensRes.data ?? [];

  const groups: AdminGroup[] = rows.map((r) => {
    const host = hosts.get(r.host_id);
    const mine = memberships.filter((m) => m.group_id === r.id);
    const waiting = mine.filter((m) => m.status === 'pending').sort((a, b) => a.requested_at.localeCompare(b.requested_at));
    const groupKits = kits.filter((k) => k.group_id === r.id);
    const today = localNow(r.timezone || 'America/Chicago').date;
    const next = r.status === 'active' ? gatheringOnOrAfter(r, today) : null;
    // The last three gatherings before today, and whether each had a meal.
    const past: string[] = [];
    let cursor = today;
    for (let i = 0; i < 3 && r.status === 'active'; i++) {
      const d = gatheringBefore(r, cursor);
      if (!d || d < r.start_date) break;
      past.push(d);
      cursor = d;
    }
    const meals = new Set(groupKits.map((k) => k.meeting_date));
    return {
      id: r.id,
      name: r.name ?? 'Unnamed group',
      countrySlug: r.country_slug,
      countryName: countries.find((c) => c.slug === r.country_slug)?.name ?? r.country_slug,
      status: r.status,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
      host: host ? { name: host.name, email: host.email, token: host.host_token } : null,
      members: mine.filter((m) => m.status === 'accepted').length,
      waitingRequests: waiting.length,
      oldestWaitingAt: waiting[0]?.requested_at ?? null,
      lastMeal: groupKits[0] ? { meetingDate: groupKits[0].meeting_date, sentAt: groupKits[0].created_at } : null,
      nextGathering: next,
      nextMealSent: !!next && meals.has(next),
      missedMeals: past.filter((d) => !meals.has(d)).length,
      autoMessages: r.auto_messages,
      withApp: opens.filter((o) => o.group_id === r.id).length,
      isTest: r.id === QA_GROUP_ID,
    };
  });

  const attention: Attention[] = [];
  for (const g of groups.filter((x) => !x.isTest)) {
    if (g.status === 'pending') {
      const days = daysSince(g.createdAt);
      attention.push({
        key: `pending-${g.id}`, kind: 'pending_group', groupId: g.id, urgent: days >= 2,
        title: `${g.name} is waiting for approval`,
        detail: `${g.countryName} · submitted ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}${g.host ? ` by ${g.host.name}` : ''}`,
      });
    }
    if (g.status === 'active' && g.waitingRequests > 0 && g.oldestWaitingAt && daysSince(g.oldestWaitingAt) >= 3) {
      const days = daysSince(g.oldestWaitingAt);
      attention.push({
        key: `requests-${g.id}`, kind: 'waiting_requests', groupId: g.id, urgent: days >= 7,
        title: `${g.waitingRequests} join request${g.waitingRequests === 1 ? '' : 's'} waiting in ${g.name}`,
        detail: `The oldest has waited ${days} days. The host approves them on their dashboard.`,
      });
    }
    if (g.status === 'active' && g.nextGathering && !g.nextMealSent) {
      const today = new Date().toISOString().slice(0, 10);
      const until = dayDiff(today, g.nextGathering);
      if (until <= 10) {
        attention.push({
          key: `meal-${g.id}`, kind: 'meal_due', groupId: g.id, urgent: until <= 5,
          title: `${g.name}: the ${short(g.nextGathering)} meal hasn't been sent`,
          detail: `The gathering is ${until === 0 ? 'today' : `in ${until} day${until === 1 ? '' : 's'}`}. Meals go out best 5+ days before.`,
        });
      }
    }
    if (g.status === 'active' && g.missedMeals >= 2) {
      attention.push({
        key: `stalled-${g.id}`, kind: 'stalled', groupId: g.id, urgent: true,
        title: `${g.name} has gone quiet`,
        detail: `No meal for ${g.missedMeals} of the last 3 gatherings${g.lastMeal ? `; the last went out ${short(g.lastMeal.sentAt)}` : ''}. Check in with the host.`,
      });
    }
  }
  attention.sort((a, b) => Number(b.urgent) - Number(a.urgent));
  return { groups, attention };
}

// ─── Reviewing new groups ─────────────────────────────────────────────────────

export function groupLiveEmailHtml(o: { hostFirstName: string; groupName: string; countryName: string; countryUrl: string; dashboardUrl: string }) {
  return `
<div style="background:#E9E6DF;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1B1B">
  <div style="max-width:560px;margin:0 auto;background:#FBF9F4;border:2px solid #1C1B1B;padding:28px 26px">
    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#625E53">${esc(o.countryName)} · Your group is live</p>
    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.15">${esc(o.groupName)} is live</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55">Hi ${esc(o.hostFirstName)}, your group now appears on the ${esc(o.countryName)} page, so people can find it and ask to join. Here's what to do next:</p>
    <ol style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6">
      <li>Share your group with friends and your church. Your group's page is on the ${esc(o.countryName)} page.</li>
      <li>Approve people as they ask to join (you'll get an email each time).</li>
      <li>A few days before your first gathering, send the month's meal from your dashboard.</li>
    </ol>
    <a href="${esc(o.dashboardUrl)}" style="display:inline-block;background:#1C1B1B;color:#FBF9F4;padding:14px 22px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;margin:0 8px 8px 0">Open your dashboard</a>
    <a href="${esc(o.countryUrl)}" style="display:inline-block;border:2px solid #1C1B1B;color:#1C1B1B;padding:12px 20px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;margin:0 8px 8px 0">See it on the map</a>
    <p style="margin:14px 0 0;font-size:13px;color:#625E53">Questions? Just reply. Your dashboard link is private: keep it to yourself.</p>
  </div>
</div>`;
}

export type ReviewResult = { success: true; emailed: boolean } | { success: false; error: string };

/** Approves a pending group, records who did it, and emails the host that it's live. */
export async function approveGroup(groupId: string, reviewerId: string | null): Promise<ReviewResult> {
  if (!UUID.test(groupId)) return { success: false, error: 'Group not found.' };
  const { data: g } = await supabase.from('groups').select('id, name, country_slug, status, host_id').eq('id', groupId).maybeSingle() as unknown as {
    data: { id: string; name: string | null; country_slug: string; status: string; host_id: string } | null;
  };
  if (!g) return { success: false, error: 'Group not found.' };
  if (g.status === 'active') return { success: true, emailed: false };
  if (g.status !== 'pending') return { success: false, error: `This group is ${g.status}; only pending groups can be approved.` };

  const { error } = await supabase
    .from('groups')
    .update({ status: 'active', reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq('id', groupId)
    .eq('status', 'pending');
  if (error) return { success: false, error: 'Could not approve the group. Please try again.' };

  const { data: host } = await supabase.from('hosts').select('name, email, host_token').eq('id', g.host_id).maybeSingle() as unknown as {
    data: { name: string; email: string; host_token: string } | null;
  };
  let emailed = false;
  if (host) {
    const countryName = countries.find((c) => c.slug === g.country_slug)?.name ?? g.country_slug;
    emailed = await sendEmail({
      to: host.email,
      subject: `${g.name ?? 'Your group'} is live on Mission Table`,
      html: groupLiveEmailHtml({
        hostFirstName: host.name.split(/\s+/)[0],
        groupName: g.name ?? 'Your group',
        countryName,
        countryUrl: `${SITE_URL}/country/${g.country_slug}`,
        dashboardUrl: `${SITE_URL}/host/${host.host_token}`,
      }),
      replyTo: ADMIN_INBOX,
    });
  }
  return { success: true, emailed };
}

/** Declines a pending group (hidden, not deleted). The admin follows up with the host personally. */
export async function declineGroup(groupId: string, reviewerId: string): Promise<ReviewResult> {
  if (!UUID.test(groupId)) return { success: false, error: 'Group not found.' };
  const { error, data } = await supabase
    .from('groups')
    .update({ status: 'inactive', reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq('id', groupId)
    .eq('status', 'pending')
    .select('id') as unknown as { error: unknown; data: { id: string }[] | null };
  if (error) return { success: false, error: 'Could not decline the group. Please try again.' };
  if (!data?.length) return { success: false, error: 'Only pending groups can be declined.' };
  return { success: true, emailed: false };
}
