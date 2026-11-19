import 'server-only';
import { Resend } from 'resend';
import { supabase } from './supabase';
import { esc } from './escapeHtml';
import { getGroupHosts, getMembersForGroup } from './queries';
import { countries } from '@/data/countries';
import type { HostNoteKind, HostNoteRow, MealInviteRow } from './database.types';

export const SITE_URL = process.env.SITE_URL ?? 'https://missiontable.org';
const FROM = 'Mission Table <noreply@requesttojoin.missiontable.org>';

// ─── Dates ────────────────────────────────────────────────────────────────────

const DOW: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export type Rhythm = {
  rhythm_type: string;
  day_of_month: number | null;
  week_of_month: number | null;
  day_of_week: string | null;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** The gathering date in a given month (month is 0-based), or null if the rhythm is incomplete. */
export function meetingDateInMonth(r: Rhythm, year: number, month: number): string | null {
  if (r.rhythm_type === 'date_of_month' && r.day_of_month) {
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return `${year}-${pad(month + 1)}-${pad(Math.min(r.day_of_month, last))}`;
  }
  if (r.rhythm_type === 'day_of_week_pattern' && r.week_of_month && r.day_of_week && DOW[r.day_of_week] !== undefined) {
    const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const day = 1 + ((DOW[r.day_of_week] - firstDow + 7) % 7) + (r.week_of_month - 1) * 7;
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }
  return null;
}

/** First gathering on or after `date` (YYYY-MM-DD). */
export function gatheringOnOrAfter(r: Rhythm, date: string): string | null {
  let [y, m] = date.split('-').map(Number);
  m -= 1;
  for (let i = 0; i < 14; i++) {
    const d = meetingDateInMonth(r, y, m);
    if (d && d >= date) return d;
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return null;
}

/** Last gathering strictly before `date` (YYYY-MM-DD). */
export function gatheringBefore(r: Rhythm, date: string): string | null {
  let [y, m] = date.split('-').map(Number);
  m -= 1;
  for (let i = 0; i < 14; i++) {
    const d = meetingDateInMonth(r, y, m);
    if (d && d < date) return d;
    m -= 1;
    if (m < 0) { m = 11; y -= 1; }
  }
  return null;
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Today's date and hour in a time zone. */
export function localNow(timeZone: string, now = new Date()): { date: string; hour: number } {
  let tz = timeZone;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch { tz = 'America/Chicago'; }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

export function longDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function defaultNote(kind: HostNoteKind, opts: { hostFirstName: string; countryName: string; date: string }): string {
  if (kind === 'rsvp') {
    return `Friends, our next gathering is this ${longDate(opts.date, { weekday: 'long' })}, ${longDate(opts.date, { month: 'long', day: 'numeric' })}. I'd love to know who'll be at the table praying for ${opts.countryName} with us. Even if it's just you and a plate of leftovers, you count!\n\n– ${opts.hostFirstName}`;
  }
  return `Thank you for gathering to pray for ${opts.countryName}. Every table matters, and it means so much to know you were there. See you next month.\n\n– ${opts.hostFirstName}`;
}

export async function getHostNote(groupId: string, date: string, kind: HostNoteKind): Promise<HostNoteRow | null> {
  const { data } = await supabase
    .from('host_notes')
    .select('*')
    .eq('group_id', groupId)
    .eq('meeting_date', date)
    .eq('kind', kind)
    .maybeSingle() as unknown as { data: HostNoteRow | null };
  return data;
}

// ─── RSVPs ────────────────────────────────────────────────────────────────────

export async function getRsvps(groupId: string, date: string): Promise<{ in: string[]; out: string[]; inTimes: { memberId: string; at: string }[] }> {
  const { data } = await supabase
    .from('gathering_rsvps')
    .select('member_id, status, responded_at')
    .eq('group_id', groupId)
    .eq('meeting_date', date) as unknown as { data: { member_id: string; status: 'in' | 'out'; responded_at: string }[] | null };
  const rows = data ?? [];
  return {
    in: rows.filter((r) => r.status === 'in').map((r) => r.member_id),
    out: rows.filter((r) => r.status === 'out').map((r) => r.member_id),
    inTimes: rows.filter((r) => r.status === 'in').map((r) => ({ memberId: r.member_id, at: r.responded_at })),
  };
}

export function tablePhotoUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/table-photos/${path}`;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export async function sendEmail(msg: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email skipped: no RESEND_API_KEY] ${msg.subject} -> ${msg.to}`);
    return false;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to: msg.to, subject: msg.subject, html: msg.html, replyTo: msg.replyTo });
    if (error) { console.error('Email failed:', error); return false; }
    return true;
  } catch (err) {
    console.error('Email failed:', err);
    return false;
  }
}

const shell = (inner: string) => `
<div style="background:#E9E6DF;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1B1B">
  <div style="max-width:560px;margin:0 auto;background:#FBF9F4;border:2px solid #1C1B1B;padding:28px 26px">${inner}</div>
</div>`;

const eyebrow = (t: string) => `<p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#625E53">${esc(t)}</p>`;
const btn = (href: string, label: string, primary = true) =>
  `<a href="${esc(href)}" style="display:inline-block;${primary ? 'background:#1C1B1B;color:#FBF9F4;' : 'border:2px solid #1C1B1B;color:#1C1B1B;'}padding:14px 22px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;margin:0 8px 8px 0">${esc(label)}</a>`;
const noteBlock = (who: string, body: string) => `
  <p style="margin:0 0 6px;font-size:13px;font-weight:700">A note from ${esc(who)}</p>
  <p style="margin:0 0 22px;font-family:Georgia,serif;font-size:18px;line-height:1.5;white-space:pre-line">${esc(body)}</p>`;

export function rsvpEmailHtml(o: {
  groupName: string; hostFirstName: string; note: string; date: string; timeLabel: string;
  inUrl: string; outUrl: string; inCount: number; groupUrl: string; recipe: string | null;
}) {
  return shell(`
    ${eyebrow(o.groupName)}
    ${noteBlock(o.hostFirstName, o.note)}
    <div style="border-top:2px solid #1C1B1B;padding-top:18px">
      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:700">Are you in?</p>
      <p style="margin:0 0 16px;font-size:15px;color:#3A372F">${esc(longDate(o.date))} · ${esc(o.timeLabel)} · at your own table</p>
      ${btn(o.inUrl, "We're in")}${btn(o.outUrl, 'Not this month', false)}
      ${o.inCount > 0 ? `<p style="margin:10px 0 0;font-size:14px;color:#3A372F">${o.inCount} ${o.inCount === 1 ? 'household is' : 'households are'} already in.</p>` : ''}
    </div>
    ${o.recipe ? `<p style="margin:22px 0 0;font-size:14px">This month's meal: <strong>${esc(o.recipe)}</strong> · <a href="${esc(o.groupUrl)}" style="color:#1C1B1B;font-weight:700">Recipe &amp; prayer →</a></p>` : ''}
    <p style="margin:22px 0 0;font-size:13px;color:#625E53">Reply to this email to write to ${esc(o.hostFirstName)} directly.</p>
  `);
}

export function thanksEmailHtml(o: {
  groupName: string; hostFirstName: string; note: string; tables: number; countryName: string;
  photos: string[]; prayers: { text: string; who: string }[]; shareUrl: string; nextDate: string | null;
}) {
  const photos = o.photos.slice(0, 6).map((u) => `<img src="${esc(u)}" alt="" width="160" height="160" style="width:160px;height:160px;object-fit:cover;margin:0 6px 6px 0;border:1px solid #C9C3B5">`).join('');
  const prayers = o.prayers.slice(0, 3).map((p) => `
    <div style="border-top:1px solid #1C1B1B;padding:12px 0">
      <p style="margin:0;font-family:Georgia,serif;font-size:17px;line-height:1.4">“${esc(p.text)}”</p>
      <p style="margin:4px 0 0;font-size:12px;color:#625E53">${esc(p.who)}</p>
    </div>`).join('');
  return shell(`
    ${eyebrow(o.groupName)}
    ${noteBlock(o.hostFirstName, o.note)}
    ${o.tables > 0 ? `<div style="background:#1C1B1B;color:#FBF9F4;padding:18px 20px;margin-bottom:20px"><span style="font-family:Georgia,serif;font-size:36px;font-weight:700">${o.tables}</span> <span style="font-size:15px">${o.tables === 1 ? 'table' : 'tables'} gathered to pray for ${esc(o.countryName)}.</span></div>` : ''}
    ${photos ? `<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Around the table</p><div>${photos}</div>` : ''}
    ${prayers ? `<p style="margin:18px 0 0;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">What we prayed</p>${prayers}` : ''}
    <div style="border:2px dashed #8A3A12;padding:16px;margin-top:18px">
      <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:19px">Share your table</p>
      <p style="margin:0 0 12px;font-size:14px;color:#3A372F">Add a photo and one line of what you prayed.</p>
      ${btn(o.shareUrl, 'Share our table')}
    </div>
    ${o.nextDate ? `<p style="margin:20px 0 0;font-size:14px"><strong>Next gathering: ${esc(longDate(o.nextDate))}.</strong></p>` : ''}
    <p style="margin:8px 0 0;font-size:13px;color:#625E53">Reply to this email to write to ${esc(o.hostFirstName)} directly.</p>
  `);
}

export function hostReminderHtml(o: { hostFirstName: string; groupName: string; kind: HostNoteKind; date: string; sendsOn: string; dashboardUrl: string }) {
  const what = o.kind === 'rsvp' ? '“Are you in?” note' : 'thank-you note';
  return shell(`
    ${eyebrow(o.groupName)}
    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;font-weight:700">Write your ${what}</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.5">Hi ${esc(o.hostFirstName)}, your ${what} for the ${esc(longDate(o.date, { month: 'long', day: 'numeric' }))} gathering goes to your group ${esc(o.sendsOn)}. A few lines in your own words is perfect. If you don't write one, a standard note signed by you goes out instead.</p>
    ${btn(o.dashboardUrl, 'Write my note')}
  `);
}

const FOOD_LABEL: Record<string, string> = {
  cook: "They're cooking this month's meal",
  potluck: 'Potluck: bring a side if you can',
  order: 'Everyone orders their own',
};

export function inviteSummary(inv: MealInviteRow, inviterFirst: string) {
  const where = inv.place_type === 'restaurant'
    ? `${inv.place_name ?? 'A restaurant'}${inv.city ? `, ${inv.city}` : ''}`
    : `${inviterFirst}'s home${inv.city ? ` in ${inv.city}${inv.state ? `, ${inv.state}` : ''}` : ''}`;
  return { where, food: inv.food ? FOOD_LABEL[inv.food] : null };
}

export function inviteEmailHtml(o: {
  groupName: string; inviterName: string; inviterMeta: string; inv: MealInviteRow; detailsUrl: string;
}) {
  const first = o.inviterName.split(/\s+/)[0];
  const { where, food } = inviteSummary(o.inv, first);
  return shell(`
    ${eyebrow(`${o.groupName} · Eat together`)}
    <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.15">${esc(o.inviterName)} invited you to eat together</p>
    <p style="margin:0 0 18px;font-size:13px;color:#625E53">${esc(o.inviterMeta)}</p>
    ${o.inv.note ? `<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:17px;line-height:1.45;border-left:3px solid #8A3A12;padding-left:12px;white-space:pre-line">“${esc(o.inv.note)}”</p>` : ''}
    <table style="border-collapse:collapse;width:100%;border-top:1px solid #1C1B1B;border-bottom:1px solid #1C1B1B;margin-bottom:20px;font-size:15px">
      <tr><td style="padding:10px 12px 10px 0;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;vertical-align:top;width:90px">When</td><td style="padding:10px 0">${esc(longDate(o.inv.meeting_date))}${o.inv.arrive_time ? ` · arrive ${esc(o.inv.arrive_time)}` : ''}</td></tr>
      <tr><td style="padding:10px 12px 10px 0;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;vertical-align:top">Where</td><td style="padding:10px 0">${esc(where)}<br><span style="font-size:13px;color:#625E53">Full address is in the details</span></td></tr>
      ${food ? `<tr><td style="padding:10px 12px 10px 0;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;vertical-align:top">Food</td><td style="padding:10px 0">${esc(food)}</td></tr>` : ''}
    </table>
    ${btn(o.detailsUrl, 'View details & reply')}
    <p style="margin:14px 0 0;font-size:13px;color:#625E53">Reply to this email to reach ${esc(first)} directly.</p>
  `);
}

export function inviteResponseHtml(o: { guestName: string; accepted: boolean; date: string; detailsUrl: string }) {
  return shell(`
    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;font-weight:700">${esc(o.guestName)} ${o.accepted ? "is coming" : "can't make it"}</p>
    <p style="margin:0 0 18px;font-size:15px">${o.accepted ? 'They accepted' : 'They declined'} your invitation for ${esc(longDate(o.date, { weekday: 'long', month: 'long', day: 'numeric' }))}.</p>
    ${btn(o.detailsUrl, 'See your invitation')}
  `);
}

// ─── The scheduled loop ───────────────────────────────────────────────────────

type LoopGroup = Rhythm & {
  id: string; name: string | null; country_slug: string; timezone: string; meeting_time: string; auto_messages: boolean; status: string;
};

export type LoopAction = {
  groupId: string; groupName: string; kind: string; meetingDate: string; recipients: number; sent?: number; preview?: { subject: string; to: string; html: string };
};

/** Hour (local) at or after which each send goes out, and its offset from the gathering date. */
export const LOOP_SCHEDULE = [
  { kind: 'host_reminder_rsvp', offset: -5, hour: 9 },
  { kind: 'rsvp', offset: -3, hour: 9 },
  { kind: 'host_reminder_thanks', offset: 1, hour: 9 },
  { kind: 'thanks', offset: 1, hour: 18 },
] as const;

function formatTime(meetingTime: string, timezone: string): string {
  const [h, m] = meetingTime.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? '';
  return `${hour12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}${zone ? ` ${zone}` : ''}`;
}

/**
 * Sends whatever is due right now. Safe to run every hour: each send is claimed
 * in gathering_sends first, so it goes out at most once.
 */
export async function runGatheringLoop(opts: { now?: Date; groupId?: string; dryRun?: boolean; preview?: boolean } = {}): Promise<LoopAction[]> {
  const now = opts.now ?? new Date();
  let q = supabase
    .from('groups')
    .select('id, name, country_slug, timezone, meeting_time, auto_messages, status, rhythm_type, day_of_month, week_of_month, day_of_week')
    .eq('status', 'active');
  q = opts.groupId ? q.eq('id', opts.groupId) : q.eq('auto_messages', true);
  const { data: groups } = await q as unknown as { data: LoopGroup[] | null };

  const actions: LoopAction[] = [];

  for (const g of groups ?? []) {
    if (!g.auto_messages && !opts.dryRun) continue;
    const local = localNow(g.timezone, now);
    const next = gatheringOnOrAfter(g, local.date);
    const prev = gatheringBefore(g, local.date);
    const countryName = countries.find((c) => c.slug === g.country_slug)?.name ?? g.country_slug;
    const groupName = g.name ?? countryName;

    for (const s of LOOP_SCHEDULE) {
      const D = s.offset < 0 ? next : prev;
      if (!D) continue;
      const target = addDays(D, s.offset);
      // Due from the target day/hour; a missed run catches up until the day before the gathering (or 2 days after).
      const lastOk = s.offset < 0 ? addDays(D, -1) : addDays(D, 2);
      const due = (local.date > target || (local.date === target && local.hour >= s.hour)) && local.date <= lastOk;
      if (!due) continue;

      const { data: already } = await supabase
        .from('gathering_sends').select('id').eq('group_id', g.id).eq('meeting_date', D).eq('kind', s.kind).maybeSingle();
      if (already) continue;

      const action = await prepareSend(g, s.kind, D, groupName, countryName);
      if (!action) continue;
      const entry: LoopAction = { groupId: g.id, groupName, kind: s.kind, meetingDate: D, recipients: action.messages.length };
      if (opts.preview && action.messages[0]) entry.preview = { subject: action.messages[0].subject, to: action.messages[0].to, html: action.messages[0].html };

      if (!opts.dryRun) {
        // Claim first so overlapping runs can't double-send.
        const { error: claimErr } = await supabase
          .from('gathering_sends')
          .insert({ group_id: g.id, meeting_date: D, kind: s.kind, recipients: action.messages.length });
        if (claimErr) continue;
        let sent = 0;
        for (const m of action.messages) if (await sendEmail(m)) sent += 1;
        entry.sent = sent;
      }
      actions.push(entry);
    }
  }
  return actions;
}

type Prepared = { messages: { to: string; subject: string; html: string; replyTo?: string }[] };

async function prepareSend(g: LoopGroup, kind: string, D: string, groupName: string, countryName: string): Promise<Prepared | null> {
  const hosts = await getGroupHosts(g.id);
  const primary = hosts[0];
  if (!primary) return null;
  const hostFirst = primary.name.split(/\s+/)[0];
  const timeLabel = formatTime(g.meeting_time, g.timezone);

  if (kind === 'host_reminder_rsvp' || kind === 'host_reminder_thanks') {
    const noteKind: HostNoteKind = kind === 'host_reminder_rsvp' ? 'rsvp' : 'thanks';
    const note = await getHostNote(g.id, D, noteKind);
    if (note && (note.skip || note.body?.trim())) return { messages: [] }; // already handled
    const sendsOn = noteKind === 'rsvp'
      ? `on ${longDate(addDays(D, -3), { weekday: 'long', month: 'long', day: 'numeric' })}`
      : 'this evening';
    return {
      messages: hosts.map((h) => ({
        to: h.email,
        subject: noteKind === 'rsvp' ? `Write your “Are you in?” note for ${longDate(D, { month: 'short', day: 'numeric' })}` : 'Write your thank-you note for last night',
        html: hostReminderHtml({ hostFirstName: h.name.split(/\s+/)[0], groupName, kind: noteKind, date: D, sendsOn, dashboardUrl: `${SITE_URL}/host/${h.host_token}` }),
      })),
    };
  }

  const noteKind: HostNoteKind = kind === 'rsvp' ? 'rsvp' : 'thanks';
  const note = await getHostNote(g.id, D, noteKind);
  if (note?.skip) return { messages: [] };
  const body = note?.body?.trim() || defaultNote(noteKind, { hostFirstName: hostFirst, countryName, date: D });
  const { accepted } = await getMembersForGroup(g.id);
  const replyTo = primary.email;

  if (kind === 'rsvp') {
    const rsvps = await getRsvps(g.id, D);
    const { data: kit } = await supabase.from('kits').select('recipe_name').eq('group_id', g.id).eq('meeting_date', D).maybeSingle() as unknown as { data: { recipe_name: string | null } | null };
    return {
      messages: accepted
        .filter((m) => !rsvps.out.includes(m.id) && !rsvps.in.includes(m.id))
        .map((m) => {
          const base = `${SITE_URL}/group/${g.id}?token=${m.member_token}`;
          return {
            to: m.email,
            replyTo,
            subject: `Are you in this ${longDate(D, { weekday: 'long' })}?`,
            html: rsvpEmailHtml({
              groupName, hostFirstName: hostFirst, note: body, date: D, timeLabel,
              inUrl: `${base}&rsvp=in&date=${D}`, outUrl: `${base}&rsvp=out&date=${D}`,
              inCount: rsvps.in.length, groupUrl: base, recipe: kit?.recipe_name ?? null,
            }),
          };
        }),
    };
  }

  // thanks
  const rsvps = await getRsvps(g.id, D);
  const { data: posts } = await supabase
    .from('table_posts').select('member_id, photo_path, prayer').eq('group_id', g.id).eq('meeting_date', D) as unknown as { data: { member_id: string; photo_path: string | null; prayer: string | null }[] | null };
  const { data: kit } = await supabase.from('kits').select('id').eq('group_id', g.id).eq('meeting_date', D).maybeSingle() as unknown as { data: { id: string } | null };
  let gatheredIds: string[] = [];
  if (kit) {
    const { data: att } = await supabase.from('kit_attendance').select('member_id').eq('kit_id', kit.id) as unknown as { data: { member_id: string }[] | null };
    gatheredIds = (att ?? []).map((a) => a.member_id);
  }
  const tables = new Set([...rsvps.in, ...gatheredIds, ...(posts ?? []).map((p) => p.member_id)]).size;
  const byId = new Map(accepted.map((m) => [m.id, m]));
  const photos = (posts ?? []).map((p) => tablePhotoUrl(p.photo_path)).filter((u): u is string => !!u);
  const prayers = (posts ?? [])
    .filter((p) => p.prayer?.trim())
    .map((p) => {
      const m = byId.get(p.member_id);
      return { text: p.prayer!.trim(), who: m ? `${m.name.split(/\s+/)[0]}${m.city ? ` · ${m.city}` : ''}` : 'A member' };
    });
  const nextDate = gatheringOnOrAfter(g, addDays(D, 1));
  return {
    messages: accepted.map((m) => ({
      to: m.email,
      replyTo,
      subject: `Thank you for ${longDate(D, { weekday: 'long' })}`,
      html: thanksEmailHtml({
        groupName, hostFirstName: hostFirst, note: body, tables, countryName, photos, prayers,
        shareUrl: `${SITE_URL}/group/${g.id}?token=${m.member_token}&tab=table`, nextDate,
      }),
    })),
  };
}

// ─── Host dashboard state ─────────────────────────────────────────────────────

export type HostNoteState = {
  kind: HostNoteKind;
  meetingDate: string;
  sendDate: string; // when it goes out (local date)
  body: string;
  skip: boolean;
  saved: boolean;
  sentAt: string | null;
  defaultBody: string;
};

export type HostLoopState = {
  autoMessages: boolean;
  nextDate: string | null;
  inNames: string[];
  outNames: string[];
  noAnswer: number;
  rsvpNote: HostNoteState | null;
  thanksNote: HostNoteState | null; // shown from the gathering day until 2 days after
};

export async function getHostLoopState(
  group: Rhythm & { id: string; timezone: string; auto_messages: boolean; country_slug: string },
  hostFirstName: string,
  accepted: { id: string; name: string }[],
): Promise<HostLoopState> {
  const today = localNow(group.timezone).date;
  const next = gatheringOnOrAfter(group, today);
  const prev = gatheringBefore(group, today);
  const countryName = countries.find((c) => c.slug === group.country_slug)?.name ?? group.country_slug;

  const thanksDate = next === today ? today : prev && addDays(prev, 2) >= today ? prev : null;
  const dates = [next, thanksDate].filter((d): d is string => !!d);

  const [rsvps, notesRes, sendsRes] = await Promise.all([
    next ? getRsvps(group.id, next) : Promise.resolve({ in: [] as string[], out: [] as string[], inTimes: [] }),
    dates.length
      ? supabase.from('host_notes').select('*').eq('group_id', group.id).in('meeting_date', dates)
      : Promise.resolve({ data: [] }),
    dates.length
      ? supabase.from('gathering_sends').select('kind, meeting_date, sent_at').eq('group_id', group.id).in('meeting_date', dates)
      : Promise.resolve({ data: [] }),
  ]) as [
    { in: string[]; out: string[] },
    { data: HostNoteRow[] | null },
    { data: { kind: string; meeting_date: string; sent_at: string }[] | null },
  ];

  const note = (kind: HostNoteKind, date: string | null, offset: number): HostNoteState | null => {
    if (!date) return null;
    const row = (notesRes.data ?? []).find((n) => n.kind === kind && n.meeting_date === date);
    const sent = (sendsRes.data ?? []).find((s) => s.kind === kind && s.meeting_date === date);
    return {
      kind,
      meetingDate: date,
      sendDate: addDays(date, offset),
      body: row?.body ?? '',
      skip: row?.skip ?? false,
      saved: !!row,
      sentAt: sent?.sent_at ?? null,
      defaultBody: defaultNote(kind, { hostFirstName, countryName, date }),
    };
  };

  const nameOf = new Map(accepted.map((m) => [m.id, m.name]));
  return {
    autoMessages: group.auto_messages,
    nextDate: next,
    inNames: rsvps.in.map((id) => nameOf.get(id)).filter((n): n is string => !!n),
    outNames: rsvps.out.map((id) => nameOf.get(id)).filter((n): n is string => !!n),
    noAnswer: accepted.filter((m) => !rsvps.in.includes(m.id) && !rsvps.out.includes(m.id)).length,
    rsvpNote: note('rsvp', next, -3),
    thanksNote: note('thanks', thanksDate, 1),
  };
}
