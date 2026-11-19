import 'server-only';
import { supabase } from './supabase';
import { esc } from './escapeHtml';
import { SITE_URL, sendEmail } from './gathering';
import { getGroupHosts, getMembersForGroup } from './queries';
import { appIconsFor, homeScreenName } from './appIcons';

// "Put the group on your phone" email: members get a one-tap link that opens
// their group with step-by-step instructions for their phone (?install=1).

export const APP_EMAIL_KIND = 'app_email';

export type AppStats = {
  members: number;
  withApp: number;
  /** Members without the app, who the email would go to. */
  withoutApp: number;
  lastSent: { at: string; recipients: number } | null;
  sentToday: boolean;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAppStats(groupId: string): Promise<AppStats> {
  const [members, opens, sends] = await Promise.all([
    getMembersForGroup(groupId),
    supabase.from('member_app_opens').select('member_id').eq('group_id', groupId) as unknown as Promise<{ data: { member_id: string }[] | null }>,
    supabase.from('gathering_sends').select('meeting_date, sent_at, recipients').eq('group_id', groupId).eq('kind', APP_EMAIL_KIND)
      .order('sent_at', { ascending: false }).limit(1) as unknown as Promise<{ data: { meeting_date: string; sent_at: string; recipients: number }[] | null }>,
  ]);
  const ids = new Set(members.accepted.map((m) => m.id));
  const withApp = new Set((opens.data ?? []).map((o) => o.member_id).filter((id) => ids.has(id))).size;
  const last = sends.data?.[0] ?? null;
  return {
    members: ids.size,
    withApp,
    withoutApp: ids.size - withApp,
    lastSent: last ? { at: last.sent_at, recipients: last.recipients } : null,
    sentToday: last?.meeting_date === todayUtc(),
  };
}

export function appEmailHtml(o: { groupName: string; hostFirstName: string; countrySlug: string; appUrl: string }) {
  const icon = `${SITE_URL}${appIconsFor(o.countrySlug).apple}`;
  const label = homeScreenName(o.groupName);
  const step = (n: number, text: string) =>
    `<tr><td style="width:30px;vertical-align:top;padding:8px 0"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:11px;background:#1C1B1B;color:#FBF9F4;font-size:12px;font-weight:700;text-align:center">${n}</span></td><td style="padding:8px 0;font-size:15px;line-height:1.45">${text}</td></tr>`;
  return `
<div style="background:#E9E6DF;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1B1B">
  <div style="max-width:560px;margin:0 auto;background:#FBF9F4;border:2px solid #1C1B1B;padding:28px 26px">
    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#625E53">${esc(o.groupName)} · On your phone</p>
    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:27px;font-weight:700;line-height:1.15">Put ${esc(o.groupName)} on your phone</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.55">Messages from the group, this month’s meal and “Are you in?” now live in one place. Add it to your home screen and it opens like an app, straight to your group.</p>
    <table role="presentation" style="border-collapse:collapse;margin:0 0 22px"><tr>
      <td style="vertical-align:middle;padding-right:14px;text-align:center">
        <img src="${esc(icon)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border-radius:15px;border:0">
        <span style="display:block;font-size:11px;margin-top:4px;color:#1C1B1B">${esc(label)}</span>
      </td>
      <td style="vertical-align:middle;font-size:14px;line-height:1.5;color:#3A372F">Look for this on your home screen.<br>Free. No app store, no password.</td>
    </tr></table>
    <a href="${esc(o.appUrl)}" style="display:inline-block;background:#1C1B1B;color:#FBF9F4;padding:15px 24px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase">Show me how</a>
    <p style="margin:8px 0 22px;font-size:13px;color:#625E53">Opens your group with the steps for your phone. Takes about 20 seconds.</p>
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">On iPhone</p>
    <table role="presentation" style="border-collapse:collapse;width:100%;margin:0 0 14px">
      ${step(1, 'Open the link above in <strong>Safari</strong>')}
      ${step(2, 'Tap <strong>Share</strong> (the square with an arrow)')}
      ${step(3, 'Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>')}
    </table>
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">On Android</p>
    <table role="presentation" style="border-collapse:collapse;width:100%;margin:0 0 18px">
      ${step(1, 'Open the link above in <strong>Chrome</strong>')}
      ${step(2, 'Tap the <strong>⋮</strong> menu at the top right')}
      ${step(3, 'Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>')}
    </table>
    <p style="margin:0;padding-top:14px;border-top:1px solid #1C1B1B;font-size:13px;line-height:1.5;color:#625E53">Reading this on a computer? The link shows a code you can scan with your phone’s camera. Questions? Just reply to reach ${esc(o.hostFirstName)}.</p>
  </div>
</div>`;
}

export type AppEmailResult = { success: true; sent: number; recipients: number } | { success: false; error: string };

/** Emails every member of the group who hasn't opened the app yet. At most once a day per group. */
export async function sendAppEmail(groupId: string, opts: { dryRun?: boolean } = {}): Promise<AppEmailResult> {
  const { data: group } = await supabase.from('groups').select('id, name, country_slug, status').eq('id', groupId).maybeSingle() as unknown as {
    data: { id: string; name: string | null; country_slug: string; status: string } | null;
  };
  if (!group || group.status !== 'active') return { success: false, error: 'This group isn’t active.' };

  const [members, hosts, opens] = await Promise.all([
    getMembersForGroup(groupId),
    getGroupHosts(groupId),
    supabase.from('member_app_opens').select('member_id').eq('group_id', groupId) as unknown as Promise<{ data: { member_id: string }[] | null }>,
  ]);
  const has = new Set((opens.data ?? []).map((o) => o.member_id));
  const to = members.accepted.filter((m) => !has.has(m.id));
  if (to.length === 0) return { success: false, error: 'Everyone already has the app.' };
  if (opts.dryRun) return { success: true, sent: 0, recipients: to.length };

  // Claim today's send first so a double click can't email everyone twice.
  const { data: claim, error: claimError } = await supabase
    .from('gathering_sends')
    .insert({ group_id: groupId, meeting_date: todayUtc(), kind: APP_EMAIL_KIND, recipients: to.length })
    .select('id')
    .single() as unknown as { data: { id: string } | null; error: unknown };
  if (claimError || !claim) return { success: false, error: 'This email already went out today.' };

  const primary = hosts[0];
  const groupName = group.name ?? 'your group';
  let sent = 0;
  for (const m of to) {
    const ok = await sendEmail({
      to: m.email,
      subject: `Put ${groupName} on your phone`,
      html: appEmailHtml({
        groupName,
        hostFirstName: primary?.name.split(/\s+/)[0] ?? 'your host',
        countrySlug: group.country_slug,
        appUrl: `${SITE_URL}/group/${groupId}?token=${m.member_token}&install=1`,
      }),
      replyTo: primary?.email,
    });
    if (ok) sent++;
  }
  await supabase.from('gathering_sends').update({ recipients: sent }).eq('id', claim.id);
  return { success: true, sent, recipients: to.length };
}
