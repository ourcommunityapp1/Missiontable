'use server';

import { supabase } from '@/lib/supabase';
import { getMembersForGroup } from '@/lib/queries';
import { Resend } from 'resend';

export type CreateKitResult =
  | { success: true }
  | { success: false; error: string };

export async function createKit(
  token: string,
  groupId: string,
  groupDisplayName: string,
  formData: FormData,
): Promise<CreateKitResult> {
  const meetingDate = formData.get('meeting_date') as string;
  const recipeName = (formData.get('recipe_name') as string)?.trim() || null;
  const recipeUrl = (formData.get('recipe_url') as string)?.trim() || null;
  const sideDish = (formData.get('side_dish') as string)?.trim() || null;
  const scriptureText = (formData.get('scripture_text') as string)?.trim() || null;
  const scriptureReference = (formData.get('scripture_reference') as string)?.trim() || null;
  const commentary = (formData.get('commentary') as string)?.trim() || null;
  const prayerRequests = (formData.get('prayer_requests') as string)?.trim() || null;
  const gatheringPrompt = (formData.get('gathering_prompt') as string)?.trim() || null;

  if (!meetingDate) {
    return { success: false, error: 'Please select a meeting date.' };
  }

  const { error: insertError } = await supabase.from('kits').insert({
    group_id: groupId,
    meeting_date: meetingDate,
    recipe_name: recipeName,
    recipe_url: recipeUrl,
    side_dish: sideDish,
    scripture_text: scriptureText,
    scripture_reference: scriptureReference,
    commentary,
    prayer_requests: prayerRequests,
    gathering_prompt: gatheringPrompt,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'A kit already exists for that date.' };
    }
    return { success: false, error: 'Failed to save kit. Please try again.' };
  }

  // Email all accepted members
  const members = await getMembersForGroup(groupId);
  if (members.accepted.length > 0) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const groupUrl = `https://missiontable.org/group/${groupId}`;

    const dateLabel = new Date(meetingDate + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const kitHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
        <h2 style="font-size:24px;margin-bottom:4px">${groupDisplayName} — ${dateLabel} Kit</h2>
        <p style="color:#888;margin-top:0;margin-bottom:20px">Your monthly gathering kit is ready.</p>

        <div style="border:2px solid #000;padding:20px;margin-bottom:32px;background:#FBF9F4">
          <p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.5">
            Your group page is where you can see who else is gathering with you, find this kit anytime, and receive future kits from your host.
          </p>
          <a href="${groupUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-weight:bold;font-size:14px;display:inline-block;letter-spacing:0.05em">
            VIEW YOUR GROUP PAGE →
          </a>
        </div>

        ${recipeName ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:0">Recipe</h3>
        <p style="margin:4px 0">${recipeUrl ? `<a href="${recipeUrl}" style="color:#000;font-weight:bold">${recipeName}</a>` : recipeName}</p>
        ${sideDish ? `<p style="color:#555;font-size:14px">Side dish: ${sideDish}</p>` : ''}
        ` : ''}

        ${scriptureText ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Scripture</h3>
        <blockquote style="border-left:3px solid #000;margin:8px 0;padding:0 0 0 16px;font-style:italic;color:#333">${scriptureText}</blockquote>
        ${scriptureReference ? `<p style="font-size:13px;color:#555;margin-top:4px">— ${scriptureReference}</p>` : ''}
        ` : ''}

        ${commentary ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Commentary</h3>
        <p style="white-space:pre-line">${commentary}</p>
        ` : ''}

        ${prayerRequests ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Prayer Requests</h3>
        <p style="white-space:pre-line">${prayerRequests}</p>
        ` : ''}

        ${gatheringPrompt ? `
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #000;padding-top:16px;margin-top:24px">Gathering Prompt</h3>
        <p style="white-space:pre-line">${gatheringPrompt}</p>
        ` : ''}
      </div>
    `;

    try {
      for (const member of members.accepted) {
        await resend.emails.send({
          from: `Mission Table <noreply@requesttojoin.missiontable.org>`,
          to: member.email,
          subject: `${groupDisplayName} — ${dateLabel} Kit`,
          html: kitHtml,
        });
      }
    } catch (err) {
      console.error('Kit email failed:', err);
    }
  }

  return { success: true };
}
