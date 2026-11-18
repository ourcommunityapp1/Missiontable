// Netlify scheduled function: once an hour, ask the site to send any
// "Are you in?" / thank-you emails and host reminders that are due.
// Groups only get these when their host has turned on automatic emails.

export default async () => {
  const base = process.env.URL ?? 'https://missiontable.org';
  const res = await fetch(`${base}/api/cron/gathering`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
  });
  const body = await res.text();
  console.log(`gathering-loop: ${res.status} ${body.slice(0, 2000)}`);
  return new Response(null, { status: 204 });
};

export const config = { schedule: '@hourly' };
