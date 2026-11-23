import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminByToken, getAdminOverview, listAdmins, touchAdmin, type AdminGroup, type Attention } from '@/lib/admin';
import ReviewButtons from './ReviewButtons';
import AddAdminForm from './AddAdminForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Mission Table',
  robots: { index: false, follow: false },
};

const label = 'font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-black';
const short = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const ago = (iso: string | null) => {
  if (!iso) return 'never';
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
};

const STATUS: Record<string, string> = { active: 'Live', pending: 'Waiting for approval', inactive: 'Hidden', full: 'Full' };

function hostLink(g: AdminGroup) {
  return g.host ? `/host/${g.host.token}` : null;
}

function AttentionCard({ a, g, token }: { a: Attention; g: AdminGroup | undefined; token: string }) {
  const host = g?.host;
  return (
    <article className={`border-2 border-black p-4 flex flex-col gap-3 ${a.urgent ? 'bg-[#F7E9E1]' : 'bg-cream'}`}>
      <div className="flex flex-col gap-1">
        <p className={`font-inter font-bold text-[10px] tracking-[0.12em] uppercase ${a.urgent ? 'text-[#8A3A12]' : 'text-warm'}`}>
          {a.kind === 'pending_group' ? 'New group' : a.kind === 'waiting_requests' ? 'Join requests' : a.kind === 'meal_due' ? 'Meal due' : 'Gone quiet'}
          {a.urgent ? ' · overdue' : ''}
        </p>
        <h3 className="font-fraunces font-semibold text-[20px] leading-tight text-black">{a.title}</h3>
        <p className="font-inter text-sm text-[#3A372F]">{a.detail}</p>
        {host && <p className="font-inter text-xs text-warm">Host: {host.name} · <a href={`mailto:${host.email}`} className="underline">{host.email}</a></p>}
      </div>
      {a.kind === 'pending_group' && g ? (
        <ReviewButtons token={token} groupId={g.id} groupName={g.name} hostEmail={host?.email ?? null} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {g && hostLink(g) && (
            <Link href={hostLink(g)!} className="min-h-[44px] px-4 inline-flex items-center border-2 border-black font-inter text-[13px] font-semibold">
              Open their host dashboard
            </Link>
          )}
          {host && (
            <a href={`mailto:${host.email}?subject=${encodeURIComponent(`Checking in: ${g?.name ?? 'your group'}`)}`} className="min-h-[44px] px-4 inline-flex items-center font-inter text-[13px] font-semibold underline underline-offset-4">
              Email the host
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function GroupCard({ g }: { g: AdminGroup }) {
  const facts: [string, string][] = [
    ['Members', `${g.members}${g.waitingRequests ? ` · ${g.waitingRequests} waiting` : ''}`],
    ['Next gathering', g.nextGathering ? `${short(g.nextGathering)} · ${g.nextMealSent ? 'meal sent' : 'meal not sent'}` : '—'],
    ['Last meal', g.lastMeal ? `${short(g.lastMeal.meetingDate)} gathering (sent ${short(g.lastMeal.sentAt)})` : 'none yet'],
    ['Automatic emails', g.autoMessages ? 'On' : 'Off'],
    ['On their phones', `${g.withApp} member${g.withApp === 1 ? '' : 's'}`],
    ['Started', short(g.createdAt)],
  ];
  return (
    <article className="border-2 border-black bg-cream flex flex-col">
      <div className="px-4 py-3 border-b border-black flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-inter font-semibold text-[10px] tracking-[0.12em] uppercase text-warm">{g.countryName}{g.isTest ? ' · test data' : ''}</p>
          <h3 className="font-fraunces font-bold text-[20px] leading-tight text-black">{g.name}</h3>
          {g.host && <p className="font-inter text-xs text-warm mt-0.5">Host: {g.host.name} · <a href={`mailto:${g.host.email}`} className="underline">{g.host.email}</a></p>}
        </div>
        <span className={`font-inter text-[11px] font-bold tracking-[0.06em] uppercase px-2 py-1 border-2 ${g.status === 'active' ? 'border-black bg-black text-cream' : 'border-black text-black'}`}>
          {STATUS[g.status] ?? g.status}
        </span>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="font-inter font-bold text-[10px] tracking-[0.1em] uppercase text-black">{k}</dt>
            <dd className="m-0 font-inter text-[13px] text-[#3A372F]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {g.host && (
          <Link href={`/host/${g.host.token}`} className="min-h-[40px] px-3.5 inline-flex items-center border-2 border-black font-inter text-[13px] font-semibold">
            Host dashboard
          </Link>
        )}
        {g.status === 'active' && (
          <Link href={`/group/${g.id}`} className="min-h-[40px] px-3.5 inline-flex items-center font-inter text-[13px] font-semibold underline underline-offset-4">
            Public page
          </Link>
        )}
      </div>
    </article>
  );
}

const TOOLS: [string, string, string][] = [
  ['Admin handbook', 'https://github.com/ourcommunityapp1/Missiontable/blob/main/docs/ADMIN.md', 'How to approve groups, help hosts, and where everything lives'],
  ['Weekly discovery briefs', 'https://github.com/ourcommunityapp1/Missiontable/pulls?q=%22Discovery+brief%22', 'The product trio’s Monday brief'],
  ['Analytics (Mixpanel)', 'https://mixpanel.com/project/4031030', 'Visits, joins, meal emails'],
  ['Hosting (Netlify)', 'https://app.netlify.com/projects/mesademision', 'Deploys and settings'],
  ['Database (Supabase)', 'https://supabase.com/dashboard/project/soahzuroegjuzrdmkplk', 'Groups, members, meals'],
  ['Email (Resend)', 'https://resend.com/emails', 'Did an email go out?'],
];

export default async function AdminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = await getAdminByToken(token);
  if (!admin) notFound();
  await touchAdmin(admin.id);

  const [{ groups, attention }, admins] = await Promise.all([getAdminOverview(), listAdmins()]);
  const byId = new Map(groups.map((g) => [g.id, g]));
  const real = groups.filter((g) => !g.isTest);
  const live = real.filter((g) => g.status === 'active');
  const order: Record<string, number> = { pending: 0, active: 1, full: 2, inactive: 3 };
  const sorted = [...real].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name));
  const test = groups.filter((g) => g.isTest);

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[960px] mx-auto px-4 md:px-8 py-8 pb-24 flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="font-inter font-semibold text-[11px] tracking-[0.12em] uppercase text-warm">Mission Table · Admin</p>
          <h1 className="font-fraunces font-bold text-[36px] md:text-[48px] leading-none tracking-[-0.03em] text-black">Hi, {admin.name.split(/\s+/)[0]}.</h1>
          <p className="font-inter text-base text-[#3A372F]">
            {live.length} live group{live.length === 1 ? '' : 's'} · {live.reduce((n, g) => n + g.members, 0)} members · {attention.length ? `${attention.length} thing${attention.length === 1 ? '' : 's'} need${attention.length === 1 ? 's' : ''} you` : 'all clear'}
          </p>
        </header>

        <section aria-labelledby="attention" className="flex flex-col gap-3">
          <h2 id="attention" className={label}>Needs you</h2>
          {attention.length === 0 ? (
            <p className="border-2 border-black p-5 font-inter text-base text-warm">All clear: no groups waiting, no stuck join requests, and every live group&apos;s next meal is on track.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {attention.map((a) => <AttentionCard key={a.key} a={a} g={byId.get(a.groupId)} token={token} />)}
            </div>
          )}
        </section>

        <section aria-labelledby="groups" className="flex flex-col gap-3">
          <h2 id="groups" className={label}>All groups</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {sorted.map((g) => <GroupCard key={g.id} g={g} />)}
          </div>
          {test.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-inter text-sm text-warm min-h-[44px] flex items-center">Test group (hidden from the public)</summary>
              <div className="grid gap-3 md:grid-cols-2 mt-2">{test.map((g) => <GroupCard key={g.id} g={g} />)}</div>
            </details>
          )}
        </section>

        <section aria-labelledby="admins" className="flex flex-col gap-3">
          <h2 id="admins" className={label}>Admins</h2>
          <ul className="list-none m-0 p-0 border-b border-black">
            {admins.filter((a) => a.active).map((a) => (
              <li key={a.id} className="border-t border-black py-3 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-inter text-[15px] font-semibold text-black">{a.name}{a.id === admin.id ? ' (you)' : ''}</span>
                <span className="font-inter text-xs text-warm">{a.email} · last here {ago(a.last_seen_at)}</span>
              </li>
            ))}
          </ul>
          <AddAdminForm token={token} />
        </section>

        <section aria-labelledby="tools" className="flex flex-col gap-3">
          <h2 id="tools" className={label}>Tools</h2>
          <ul className="list-none m-0 p-0 grid gap-2 sm:grid-cols-2">
            {TOOLS.map(([name, href, note]) => (
              <li key={name}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="block border-2 border-black p-3.5 hover:bg-cream-dark">
                  <span className="block font-inter text-[15px] font-semibold text-black">{name} ↗</span>
                  <span className="block font-inter text-xs text-warm mt-0.5">{note}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="font-inter text-xs text-warm">This page is your login. Bookmark it and don’t share the link.</p>
        </section>
      </div>
    </main>
  );
}
