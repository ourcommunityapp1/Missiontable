'use server';

import { supabase } from '@/lib/supabase';
import { esc } from '@/lib/escapeHtml';
import { Resend } from 'resend';

export type HostLoginResult =
  | { success: true }
  | { success: false; error: string };

export async function sendHostDashboardLink(email: string): Promise<HostLoginResult> {
  const { data: host } = await supabase
    .from('hosts')
    .select('name, host_token')
    .eq('email', email.toLowerCase().trim())
    .single() as unknown as { data: { name: string; host_token: string } | null };

  // Always return success to avoid email enumeration
  if (!host) return { success: true };

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dashboardUrl = `https://missiontable.org/host/${host.host_token}`;
    await resend.emails.send({
      from: 'Mission Table <noreply@requesttojoin.missiontable.org>',
      to: email.toLowerCase().trim(),
      subject: 'Your Mission Table host dashboard link',
      html: `
        <p>Hi ${esc(host.name)},</p>
        <p>Here's your host dashboard link:</p>
        <p>
          <a href="${dashboardUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-weight:bold;display:inline-block">
            Open Your Host Dashboard →
          </a>
        </p>
        <p style="color:#888;font-size:12px;margin-top:16px">
          Bookmark this link — it's your private dashboard for managing members and sending monthly kits.
        </p>
        <p>— The Mission Table Team</p>
      `,
    });
  } catch (err) {
    console.error('Host login email failed:', err);
  }

  return { success: true };
}
