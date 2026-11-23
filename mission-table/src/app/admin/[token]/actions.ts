'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { SITE_URL, sendEmail } from '@/lib/gathering';
import { esc } from '@/lib/escapeHtml';
import { trackServer } from '@/lib/mixpanelServer';
import { getAdminByToken, approveGroup, declineGroup, type ReviewResult } from '@/lib/admin';

// Server actions are public endpoints: every one re-checks the admin token.

export async function approveGroupAction(token: string, groupId: string): Promise<ReviewResult> {
  const admin = await getAdminByToken(token);
  if (!admin) return { success: false, error: 'Your admin link is not valid.' };
  const res = await approveGroup(groupId, admin.id);
  if (res.success) await trackServer('group_approved', `admin:${admin.id}`, { group_id: groupId, host_emailed: res.emailed });
  revalidatePath(`/admin/${token}`);
  return res;
}

export async function declineGroupAction(token: string, groupId: string): Promise<ReviewResult> {
  const admin = await getAdminByToken(token);
  if (!admin) return { success: false, error: 'Your admin link is not valid.' };
  const res = await declineGroup(groupId, admin.id);
  if (res.success) await trackServer('group_declined', `admin:${admin.id}`, { group_id: groupId });
  revalidatePath(`/admin/${token}`);
  return res;
}

export type AddAdminResult = { success: true; emailed: boolean } | { success: false; error: string };

/** Adds another admin and emails them their private dashboard link. */
export async function addAdminAction(token: string, name: string, email: string): Promise<AddAdminResult> {
  const admin = await getAdminByToken(token);
  if (!admin) return { success: false, error: 'Your admin link is not valid.' };
  const cleanName = (name ?? '').trim().slice(0, 120);
  const cleanEmail = (email ?? '').trim().toLowerCase().slice(0, 200);
  if (!cleanName) return { success: false, error: 'Add their name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { success: false, error: 'That email doesn’t look right.' };

  const { data: created, error } = await supabase
    .from('admins')
    .insert({ name: cleanName, email: cleanEmail })
    .select('admin_token')
    .single() as unknown as { data: { admin_token: string } | null; error: { code?: string } | null };
  if (error?.code === '23505') return { success: false, error: 'That person is already an admin.' };
  if (error || !created) return { success: false, error: 'Could not add them. Please try again.' };

  const link = `${SITE_URL}/admin/${created.admin_token}`;
  const emailed = await sendEmail({
    to: cleanEmail,
    subject: 'You’re now a Mission Table admin',
    replyTo: admin.email,
    html: `
<div style="background:#E9E6DF;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1B1B">
  <div style="max-width:560px;margin:0 auto;background:#FBF9F4;border:2px solid #1C1B1B;padding:28px 26px">
    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.15">Welcome, ${esc(cleanName.split(/\s+/)[0])}</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55">${esc(admin.name.split(/\s+/)[0])} added you as a Mission Table admin. Your dashboard shows new groups waiting for approval and anything hosts need help with.</p>
    <a href="${esc(link)}" style="display:inline-block;background:#1C1B1B;color:#FBF9F4;padding:14px 22px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase">Open your admin dashboard</a>
    <p style="margin:16px 0 0;font-size:13px;color:#625E53">This link is your login. Bookmark it and don't share it.</p>
  </div>
</div>`,
  });
  await trackServer('admin_added', `admin:${admin.id}`, { emailed });
  revalidatePath(`/admin/${token}`);
  return { success: true, emailed };
}
