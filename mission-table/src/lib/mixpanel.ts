import mixpanel from 'mixpanel-browser';

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? 'b1a62bc7bfb11d336a7fe640b2637320';

let initialized = false;

/** Local builds and Netlify preview deploys don't send analytics to the production project. */
function isTestHost(): boolean {
  if (typeof window === 'undefined') return true;
  const h = window.location.hostname;
  return h === 'localhost' || h.startsWith('127.') || h.endsWith('.local') || h.includes('deploy-preview-') || h.includes('--mesademision');
}

export function initMixpanel() {
  if (initialized || !token || isTestHost()) return;
  mixpanel.init(token, {
    // Host and member links carry private login tokens (/host/<token>, ?token=…).
    // Never send full URLs, link targets or session recordings to Mixpanel.
    autocapture: false,
    record_sessions_percent: 0,
    property_blacklist: ['$current_url', '$initial_referrer', '$referrer', 'current_url_path', 'current_url_search', '$el_attr__href'],
    persistence: 'localStorage',
  });
  initialized = true;
}

/** Replaces login tokens in a path so it is safe to record: /host/<token>/kit/new -> /host/:token/kit/new. */
export function safePath(pathname: string): string {
  return pathname.replace(/^\/(host|admin)\/(?!login\b)[^/]+/, '/$1/:token');
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  mixpanel.track(event, props);
}

export function identify(distinctId: string) {
  if (!initialized) return;
  mixpanel.identify(distinctId);
}
