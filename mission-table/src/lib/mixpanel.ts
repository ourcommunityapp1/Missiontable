import mixpanel from 'mixpanel-browser';

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? 'b1a62bc7bfb11d336a7fe640b2637320';

let initialized = false;

export function initMixpanel() {
  if (initialized || !token) return;
  mixpanel.init(token, {
    autocapture: true,
    record_sessions_percent: 100,
    persistence: 'localStorage',
  });
  initialized = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  mixpanel.track(event, props);
}

export function identify(distinctId: string) {
  if (!initialized) return;
  mixpanel.identify(distinctId);
}
