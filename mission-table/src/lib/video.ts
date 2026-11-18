// Client-safe: turns a pasted video link into something we can play inside the app.

export type VideoProvider = 'youtube' | 'vimeo' | 'facebook';

export type EmbeddableVideo = {
  provider: VideoProvider;
  /** "YouTube", "YouTube Short", "Vimeo", "Facebook"… for labels. */
  label: string;
  /** Player URL for an <iframe>; starts playing when loaded (it's only loaded after a tap). */
  embedUrl: string;
  /** Preview image, when the provider offers one without an API call. */
  thumbnailUrl: string | null;
  /** Tall (9:16) videos: Shorts and Reels. */
  vertical: boolean;
  /** The original link, for "Open in YouTube". */
  url: string;
};

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

function parseUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/** "1m30s", "90s", "90" -> 90 */
function seconds(t: string | null): number {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

function youtube(u: URL, raw: string): EmbeddableVideo | null {
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  let short = false;
  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, first, second] = u.pathname.split('/');
    if (first === 'watch') id = u.searchParams.get('v');
    else if (first === 'shorts') { id = second ?? null; short = true; }
    else if (first === 'live' || first === 'embed' || first === 'v') id = second ?? null;
  } else {
    return null;
  }
  if (!id || !YT_ID.test(id)) return null;

  const start = seconds(u.searchParams.get('t') ?? u.searchParams.get('start'));
  const q = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', modestbranding: '1' });
  if (start) q.set('start', String(start));
  return {
    provider: 'youtube',
    label: short ? 'YouTube Short' : 'YouTube',
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    vertical: short,
    url: raw.trim(),
  };
}

function vimeo(u: URL, raw: string): EmbeddableVideo | null {
  const host = u.hostname.replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
  const parts = u.pathname.split('/').filter(Boolean);
  // vimeo.com/123, vimeo.com/123/abcdef (unlisted), vimeo.com/channels/x/123, player.vimeo.com/video/123
  const idIndex = parts.findIndex((p) => /^\d+$/.test(p));
  if (idIndex < 0) return null;
  const id = parts[idIndex];
  const hash = u.searchParams.get('h') ?? (parts[idIndex + 1] && /^[0-9a-f]+$/i.test(parts[idIndex + 1]) ? parts[idIndex + 1] : null);
  const q = new URLSearchParams({ autoplay: '1', playsinline: '1', dnt: '1' });
  if (hash) q.set('h', hash);
  return {
    provider: 'vimeo',
    label: 'Vimeo',
    embedUrl: `https://player.vimeo.com/video/${id}?${q.toString()}`,
    thumbnailUrl: null,
    vertical: false,
    url: raw.trim(),
  };
}

function facebook(u: URL, raw: string): EmbeddableVideo | null {
  const host = u.hostname.replace(/^(www|m|web|mbasic)\./, '');
  if (host !== 'facebook.com' && host !== 'fb.watch') return null;
  const path = u.pathname;
  const isVideo = host === 'fb.watch' || /^\/(reel|watch)\b/.test(path) || /\/videos\//.test(path) || path.startsWith('/share/v/') || path.startsWith('/share/r/');
  if (!isVideo) return null;
  const reel = path.startsWith('/reel/') || path.startsWith('/share/r/');
  // Facebook's player wants the canonical www link.
  const href = host === 'fb.watch' ? raw.trim() : `https://www.facebook.com${path}${u.searchParams.get('v') ? `?v=${u.searchParams.get('v')}` : ''}`;
  const q = new URLSearchParams({ href, show_text: 'false', autoplay: 'true', allowfullscreen: 'true' });
  return {
    provider: 'facebook',
    label: reel ? 'Facebook Reel' : 'Facebook',
    embedUrl: `https://www.facebook.com/plugins/video.php?${q.toString()}`,
    thumbnailUrl: null,
    vertical: reel,
    url: raw.trim(),
  };
}

/** A playable video for YouTube, Vimeo and Facebook links; null for anything else. */
export function toEmbeddable(raw: string | null | undefined): EmbeddableVideo | null {
  if (!raw) return null;
  const u = parseUrl(raw);
  if (!u) return null;
  return youtube(u, raw) ?? vimeo(u, raw) ?? facebook(u, raw);
}

/** "YouTube", "Instagram"… for a link we can't play in the app. */
export function siteName(raw: string): string {
  const u = parseUrl(raw);
  if (!u) return 'the video site';
  const host = u.hostname.replace(/^(www|m)\./, '');
  const known: Record<string, string> = {
    'youtube.com': 'YouTube', 'youtu.be': 'YouTube', 'vimeo.com': 'Vimeo', 'facebook.com': 'Facebook', 'fb.watch': 'Facebook',
    'instagram.com': 'Instagram', 'tiktok.com': 'TikTok', 'x.com': 'X', 'twitter.com': 'X', 'loom.com': 'Loom',
  };
  return known[host] ?? host;
}
