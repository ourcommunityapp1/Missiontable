// Builds the Home feed's group activity (everything except chat messages),
// oldest first, so it can be merged with chat by time. Client-safe and pure.

export type FeedItem =
  | { kind: 'field'; id: string; at: string; postId: string }
  | { kind: 'meal'; id: string; at: string; kitId: string }
  | { kind: 'rsvps'; id: string; at: string; date: string; names: string[]; total: number }
  | { kind: 'table'; id: string; at: string; postId: string }
  | { kind: 'invite'; id: string; at: string; inviteId: string };

export type FeedInput = {
  now: Date;
  /** How far back group activity goes in the feed. */
  windowDays: number;
  meId: string;
  nextDate: string | null;
  fieldPosts: { id: string; created_at: string }[];
  kits: { id: string; created_at: string }[];
  inTimes: { memberId: string; at: string }[];
  names: Map<string, string>;
  tablePosts: { id: string; memberId: string; createdAt: string }[];
  received: { id: string; created_at: string; cancelled_at: string | null }[];
};

export function buildFeed(input: FeedInput): FeedItem[] {
  const since = input.now.getTime() - input.windowDays * 86_400_000;
  const recent = (at: string) => Date.parse(at) >= since;
  const items: FeedItem[] = [];

  // Field updates in the window, and always the latest one: it's the group's reason for being.
  const latestField = [...input.fieldPosts].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  for (const p of input.fieldPosts) {
    if (recent(p.created_at) || p.id === latestField?.id) items.push({ kind: 'field', id: `field-${p.id}`, at: p.created_at, postId: p.id });
  }

  for (const k of input.kits) {
    if (recent(k.created_at)) items.push({ kind: 'meal', id: `meal-${k.id}`, at: k.created_at, kitId: k.id });
  }

  // Who's in for the next gathering: one line, not one per person.
  if (input.nextDate) {
    const others = input.inTimes.filter((r) => r.memberId !== input.meId).sort((a, b) => b.at.localeCompare(a.at));
    if (others.length > 0) {
      items.push({
        kind: 'rsvps',
        id: `rsvps-${input.nextDate}`,
        at: others[0].at,
        date: input.nextDate,
        names: others.map((r) => input.names.get(r.memberId) ?? 'A member'),
        total: others.length,
      });
    }
  }

  for (const t of input.tablePosts) {
    if (recent(t.createdAt)) items.push({ kind: 'table', id: `table-${t.id}`, at: t.createdAt, postId: t.id });
  }

  for (const i of input.received) {
    if (!i.cancelled_at) items.push({ kind: 'invite', id: `invite-${i.id}`, at: i.created_at, inviteId: i.id });
  }

  return items.sort((a, b) => a.at.localeCompare(b.at));
}

/** "Grace Banks", "Grace and Deb", "Grace, Deb and 4 others" (first names after the first). */
export function namesLine(names: string[], total: number): string {
  const first = (n: string) => n.trim().split(/\s+/)[0] ?? n;
  if (total === 1) return names[0];
  if (total === 2) return `${first(names[0])} and ${first(names[1])}`;
  return `${first(names[0])}, ${first(names[1])} and ${total - 2} other${total - 2 === 1 ? '' : 's'}`;
}
