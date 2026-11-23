const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? 'b1a62bc7bfb11d336a7fe640b2637320';

export async function trackServer(event: string, distinctId: string, props?: Record<string, unknown>) {
  // Local test runs and Netlify preview deploys don't write to the production project.
  if (!token || process.env.DISABLE_VIEW_TRACKING === '1' || (process.env.CONTEXT && process.env.CONTEXT !== 'production')) return;
  try {
    await fetch('https://api.mixpanel.com/track?ip=0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          event,
          properties: {
            token,
            distinct_id: distinctId,
            time: Math.floor(Date.now() / 1000),
            ...props,
          },
        },
      ]),
    });
  } catch (err) {
    console.error('Mixpanel server track failed:', err);
  }
}
