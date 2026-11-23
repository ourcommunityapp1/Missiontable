import { notFound } from 'next/navigation';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import {
  getHostByToken,
  getMembersForGroup,
  getKitsForGroup,
  getFieldPostsForGroup,
  getGroupActivity,
  getGroupHosts,
  getAttendanceForKits,
} from '@/lib/queries';
import { getHostLoopState } from '@/lib/gathering';
import { getChatUnread, chatEnabled } from '@/lib/chat';
import { getAppStats } from '@/lib/appEmail';
import { TABS, type TabId, type DashboardData, formatDay } from './_tabs/shared';
import OverviewTab from './_tabs/OverviewTab';
import ChatTab from './_tabs/ChatTab';
import ScrollActiveTab from './_tabs/ScrollActiveTab';
import FieldTab from './_tabs/FieldTab';
import MealsTab from './_tabs/MealsTab';
import PeopleTab from './_tabs/PeopleTab';
import InsightsTab from './_tabs/InsightsTab';
import SettingsTab from './_tabs/SettingsTab';

export const dynamic = 'force-dynamic';

const TAB_COMPONENTS: Record<TabId, (d: DashboardData) => React.ReactNode> = {
  overview: OverviewTab,
  chat: ChatTab,
  field: FieldTab,
  meals: MealsTab,
  people: PeopleTab,
  insights: InsightsTab,
  settings: SettingsTab,
};

export default async function HostDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ group?: string; tab?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const data = await getHostByToken(token);
  if (!data) notFound();

  const { host, groups } = data;

  if (groups.length === 0) {
    return (
      <main className="min-h-screen flex flex-col bg-cream">
        <TopNavBar />
        <div className="max-w-[1120px] mx-auto w-full px-6 md:px-8 py-12 pb-24 flex-1">
          <p className="font-inter font-semibold text-xs tracking-[0.12em] uppercase text-warm mb-2">Host dashboard</p>
          <h1 className="font-fraunces font-bold text-[40px] md:text-[48px] leading-none tracking-[-0.035em] text-black mb-4">Welcome, {host.name.split(/\s+/)[0]}.</h1>
          <p className="font-inter text-base text-warm max-w-[600px]">Your group is waiting for review. A Mission Table admin usually reviews new groups within 2 days, and we&apos;ll email you when it&apos;s live.</p>
        </div>
        <Footer />
      </main>
    );
  }

  const group = groups.find((g) => g.id === sp.group) ?? groups[0];
  const tabs = TABS.filter((t) => t.id !== 'chat' || chatEnabled());
  const tab: TabId = tabs.some((t) => t.id === sp.tab) ? (sp.tab as TabId) : 'overview';
  const multiGroup = groups.length > 1;

  const hrefFor = (groupId: string, t: TabId) => {
    const q = new URLSearchParams();
    if (multiGroup) q.set('group', groupId);
    if (t !== 'overview') q.set('tab', t);
    const qs = q.toString();
    return `/host/${token}${qs ? `?${qs}` : ''}`;
  };

  const [members, kits, fieldPosts, activity, cohosts] = await Promise.all([
    getMembersForGroup(group.id),
    getKitsForGroup(group.id),
    getFieldPostsForGroup(group.id),
    getGroupActivity(group),
    getGroupHosts(group.id),
  ]);
  const [attendance, loop, chatUnread, app] = await Promise.all([
    getAttendanceForKits(kits.map((k) => k.id)),
    getHostLoopState(group, host.name.split(/\s+/)[0], members.accepted),
    tab === 'chat' || !chatEnabled() ? Promise.resolve(0) : getChatUnread(group.id, host.id),
    getAppStats(group.id),
  ]);
  const gatheredByKit = Object.fromEntries(Object.entries(attendance).map(([id, a]) => [id, a.count]));

  const dashboard: DashboardData = {
    token,
    group,
    hostName: host.name,
    members,
    kits,
    fieldPosts,
    activity,
    cohosts,
    gatheredByKit,
    loop,
    app,
    tabHref: (t) => hrefFor(group.id, t),
  };
  const Panel = TAB_COMPONENTS[tab];
  const next = activity.nextGathering;

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1120px] mx-auto w-full px-6 md:px-8 pt-8 md:pt-10">
        {multiGroup && (
          <nav aria-label="Your groups" className="flex flex-wrap items-center gap-2 mb-6">
            <span className="font-inter font-semibold text-[11px] tracking-[0.12em] uppercase text-warm mr-1">Your groups</span>
            {groups.map((g) => {
              const current = g.id === group.id;
              return (
                <Link
                  key={g.id}
                  href={hrefFor(g.id, tab)}
                  aria-current={current ? 'page' : undefined}
                  className={`inline-flex items-center min-h-[36px] px-3 border-2 font-inter text-[13px] ${current ? 'border-black bg-black text-cream font-semibold' : 'border-black text-black hover:bg-cream-dark'}`}
                >
                  {g.name ?? g.countryName}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
          <div className="flex flex-col gap-2 min-w-0">
            <p className="font-inter font-semibold text-xs tracking-[0.12em] uppercase text-warm">
              {group.group_type === 'virtual' ? 'Virtual group' : 'In-person group'} · {group.countryName}
              {group.status !== 'active' && ` · ${group.status}`}
            </p>
            <h1 className="font-fraunces font-bold text-[34px] md:text-[48px] leading-none tracking-[-0.035em] text-black">
              {group.name ?? group.countryName}
            </h1>
          </div>
          {next && (
            <p className="inline-flex flex-wrap items-center gap-2.5 border-2 border-black px-3.5 py-2.5 font-inter text-sm text-black">
              <span className="font-bold">Next: {formatDay(next)}</span>
              <span aria-hidden="true" className="w-px h-4 bg-black inline-block" />
              <span className={activity.nextMealSent ? 'font-semibold' : 'font-semibold text-[#8A3A12]'}>
                {activity.nextMealSent ? 'Meal sent' : 'Meal not sent'}
              </span>
            </p>
          )}
        </div>

        {group.status === 'pending' && (
          <div role="status" className="border-2 border-black bg-[#F7E9E1] px-4 py-3.5 mb-6 flex flex-col gap-1">
            <p className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-[#8A3A12]">Waiting for review</p>
            <p className="font-inter text-sm text-black">
              A Mission Table admin reviews every new group, usually within 2 days. Your group isn&apos;t listed yet, so people can&apos;t find it or join. We&apos;ll email you the moment it&apos;s live. You can set up your first meal in the meantime. Questions? <a href="mailto:projectmissiontable@gmail.com" className="underline font-semibold">projectmissiontable@gmail.com</a>
            </p>
          </div>
        )}

        <nav id="dashboard-tabs" aria-label="Dashboard sections" className="overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
          <ul className="flex gap-1.5 w-max min-w-full md:w-auto md:flex-wrap border-b-2 border-black">
            {tabs.map((t) => {
              const current = t.id === tab;
              const badge =
                t.id === 'people' && members.pending.length > 0 ? String(members.pending.length)
                : t.id === 'chat' && chatUnread > 0 ? (chatUnread > 9 ? '9+' : String(chatUnread))
                : null;
              return (
                <li key={t.id} className="-mb-[2px]">
                  <Link
                    href={hrefFor(group.id, t.id)}
                    aria-current={current ? 'page' : undefined}
                    className={`inline-flex items-center gap-2 min-h-[48px] px-4 md:px-[22px] border-2 font-inter text-sm whitespace-nowrap transition-colors ${
                      current
                        ? 'bg-cream text-black font-bold border-black border-b-cream'
                        : 'bg-[#EFECE5] text-warm font-medium border-[#EFECE5] border-b-black hover:text-black'
                    }`}
                  >
                    {t.label}
                    {badge && (
                      <span className="min-w-[22px] h-[22px] rounded-full bg-black text-cream text-xs font-bold inline-flex items-center justify-center px-1.5" aria-label={t.id === 'chat' ? `${badge} new message${badge === '1' ? '' : 's'}` : `${badge} waiting`}>
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ScrollActiveTab navId="dashboard-tabs" />
        </nav>
      </div>

      <section aria-label={TABS.find((t) => t.id === tab)!.label} className="max-w-[1120px] mx-auto w-full px-6 md:px-8 pt-8 md:pt-10 pb-24 flex-1">
        <Panel {...dashboard} />
      </section>

      <Footer />
    </main>
  );
}
