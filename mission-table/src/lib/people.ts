// Client-safe helpers for comparing members' churches and locations.

const STOP_WORDS = new Set(['the', 'of', 'at', 'and', '&']);

function words(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    // "Henderson Hill" vs "Henderson Hills": drop a trailing plural s on longer words
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
}

/** Normalized key for a church name; null when blank. */
export function churchKey(name: string | null | undefined): string | null {
  const w = words(name ?? '');
  return w.length ? w.join(' ') : null;
}

/** Initials of a multi-word church name, e.g. "Henderson Hills Baptist Church" -> "hhbc". */
function acronym(name: string): string | null {
  const w = (name ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((x) => x && !STOP_WORDS.has(x));
  return w.length >= 2 ? w.map((x) => x[0]).join('') : null;
}

/** True when two free-text church names very likely mean the same church. */
export function sameChurch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = churchKey(a);
  const kb = churchKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const compactA = ka.replace(/\s/g, '');
  const compactB = kb.replace(/\s/g, '');
  const accA = acronym(a!);
  const accB = acronym(b!);
  return (!!accA && accA === compactB) || (!!accB && accB === compactA);
}

/**
 * Picks the most descriptive spelling among names that refer to the same church,
 * so "HHBC" is shown as "Henderson Hills Baptist Church" when someone spelled it out.
 */
export function bestChurchLabel(name: string | null | undefined, allNames: (string | null | undefined)[]): string | null {
  if (!name?.trim()) return null;
  const same = allNames.filter((n): n is string => !!n?.trim() && sameChurch(n, name));
  const counts = new Map<string, number>();
  for (const n of same) counts.set(n.trim(), (counts.get(n.trim()) ?? 0) + 1);
  const ranked = [...counts.entries()]
    .filter(([n]) => n.includes(' ')) // prefer spelled-out names over acronyms
    .sort((x, y) => y[1] - x[1] || y[0].length - x[0].length);
  return ranked[0]?.[0] ?? name.trim();
}

function norm(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase().replace(/[^a-z]/g, '');
}

const STATE_CODES: Record<string, string> = {
  alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca', colorado: 'co', connecticut: 'ct',
  delaware: 'de', florida: 'fl', georgia: 'ga', hawaii: 'hi', idaho: 'id', illinois: 'il', indiana: 'in', iowa: 'ia',
  kansas: 'ks', kentucky: 'ky', louisiana: 'la', maine: 'me', maryland: 'md', massachusetts: 'ma', michigan: 'mi',
  minnesota: 'mn', mississippi: 'ms', missouri: 'mo', montana: 'mt', nebraska: 'ne', nevada: 'nv', newhampshire: 'nh',
  newjersey: 'nj', newmexico: 'nm', newyork: 'ny', northcarolina: 'nc', northdakota: 'nd', ohio: 'oh', oklahoma: 'ok',
  oregon: 'or', pennsylvania: 'pa', rhodeisland: 'ri', southcarolina: 'sc', southdakota: 'sd', tennessee: 'tn',
  texas: 'tx', utah: 'ut', vermont: 'vt', virginia: 'va', washington: 'wa', westvirginia: 'wv', wisconsin: 'wi', wyoming: 'wy',
};

function stateKey(state: string | null | undefined): string {
  const s = norm(state);
  return STATE_CODES[s] ?? s;
}

/** Same city (and state when both are known). Members only share city/state, never addresses. */
export function sameArea(
  a: { city: string | null; state: string | null },
  b: { city: string | null; state: string | null },
): boolean {
  if (!norm(a.city) || norm(a.city) !== norm(b.city)) return false;
  const sa = stateKey(a.state);
  const sb = stateKey(b.state);
  return !sa || !sb || sa === sb;
}

export function placeLabel(city: string | null, state: string | null): string {
  return [city?.trim(), state?.trim()].filter(Boolean).join(', ');
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter((p) => /[A-Za-z]/.test(p))
    .slice(0, 2)
    .map((p) => p.replace(/[^A-Za-z]/g, '')[0]?.toUpperCase() ?? '')
    .join('');
}
