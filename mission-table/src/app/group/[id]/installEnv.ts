// Client-safe: works out how this person can add the group app to their home screen.

export type InstallKind =
  | 'standalone' // already opened from the home screen
  | 'ios-safari'
  | 'ios-other' // Chrome, Firefox, Edge… on iPhone/iPad
  | 'in-app' // a link opened inside Facebook, Instagram, Gmail, the Google app…
  | 'android'
  | 'desktop';

export type InstallEnv = { kind: InstallKind; platform: 'ios' | 'android' | 'desktop'; browser: string };

const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Line\/|MicroMessenger|Snapchat|Twitter|GSA\/|; wv\)|Messenger/;

export function detectInstallEnv(ua: string, opts: { standalone: boolean; maxTouchPoints?: number }): InstallEnv {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (opts.maxTouchPoints ?? 0) > 1);
  const android = /Android/.test(ua);
  const platform = ios ? 'ios' : android ? 'android' : 'desktop';
  const browser = /CriOS/.test(ua) ? 'Chrome' : /FxiOS/.test(ua) ? 'Firefox' : /EdgiOS|EdgA/.test(ua) ? 'Edge'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'your browser';
  if (opts.standalone) return { kind: 'standalone', platform, browser };
  if ((ios || android) && IN_APP.test(ua)) return { kind: 'in-app', platform, browser };
  if (ios) return { kind: browser === 'Safari' ? 'ios-safari' : 'ios-other', platform, browser };
  if (android) return { kind: 'android', platform, browser };
  return { kind: 'desktop', platform, browser };
}

/** Reads the real browser. Only call on the client. */
export function currentInstallEnv(): InstallEnv {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return detectInstallEnv(navigator.userAgent, { standalone, maxTouchPoints: navigator.maxTouchPoints });
}

// Remembered on this device: "I've added it" (for good) or "Remind me later" (for a week).
const DONE_KEY = 'mt-install-done';
const SNOOZE_KEY = 'mt-install-snoozed-until';
const LEGACY_KEY = 'mt-install-dismissed';
const SNOOZE_DAYS = 7;

export function installNudgeAllowed(now = Date.now()): boolean {
  try {
    if (localStorage.getItem(DONE_KEY) === '1' || localStorage.getItem(LEGACY_KEY) === '1') return false;
    const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    return !until || now >= until;
  } catch {
    return true;
  }
}

/** "I've added it" on this device: hide every reminder. */
export function installMarkedDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === '1' || localStorage.getItem(LEGACY_KEY) === '1';
  } catch {
    return false;
  }
}

export function markInstallDone() {
  try { localStorage.setItem(DONE_KEY, '1'); } catch { /* storage unavailable */ }
}

export function snoozeInstall(now = Date.now()) {
  try { localStorage.setItem(SNOOZE_KEY, String(now + SNOOZE_DAYS * 86_400_000)); } catch { /* storage unavailable */ }
}
