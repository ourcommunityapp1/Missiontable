import Link from 'next/link';
import { usStateName } from '@/lib/queries';
import GatheringSection from './GatheringSection';
import { type DashboardData, SectionLabel, formatDay, daysUntil, addDays, plural, btnPrimary, btnSecondary } from './shared';

const SPANISH_SPEAKING = new Set(['spain', 'guatemala', 'honduras']);

type Task = {
  key: string;
  eyebrow: string;
  urgent?: boolean;
  title: string;
  body: string;
  cta: string;
  href: string;
  primary?: boolean;
};

export default function OverviewTab(props: DashboardData) {
  const { token, group, hostName, members, fieldPosts, activity, tabHref, loop } = props;
  const firstName = hostName.split(/\s+/)[0];
  const greeting = SPANISH_SPEAKING.has(group.country_slug) ? `Hola, ${firstName}.` : `Welcome back, ${firstName}.`;
  const next = activity.nextGathering;
  const days = next ? daysUntil(next) : null;
  const monthName = next ? formatDay(next, { month: 'long' }) : null;

  const lastPost = fieldPosts[0];
  const daysSincePost = lastPost ? -daysUntil(lastPost.created_at.slice(0, 10)) : null;

  const tasks: Task[] = [];
  if (next && !activity.nextMealSent) {
    tasks.push({
      key: 'meal',
      eyebrow: `Send by ${formatDay(addDays(next, -3))}`,
      urgent: true,
      title: `Send ${monthName}'s meal`,
      body: `The recipe, scripture and prayer requests go to ${plural(activity.members, 'member')} by email. Members visit the group page most in months a meal goes out.`,
      cta: 'Create meal →',
      href: `/host/${token}/kit/new?groupId=${group.id}`,
      primary: true,
    });
  }
  if (loop.autoMessages && loop.rsvpNote && !loop.rsvpNote.sentAt && !loop.rsvpNote.saved && daysUntil(loop.rsvpNote.sendDate) <= 7) {
    tasks.push({
      key: 'note',
      eyebrow: `Goes out ${formatDay(loop.rsvpNote.sendDate)}`,
      title: 'Write your “Are you in?” note',
      body: 'A few lines in your own words. If you skip it, a standard note signed by you goes out instead.',
      cta: 'Write note →',
      href: '#notes',
    });
  }
  if (members.pending.length > 0) {
    tasks.push({
      key: 'people',
      eyebrow: 'Waiting on you',
      title: `${plural(members.pending.length, 'person', 'people')} want${members.pending.length === 1 ? 's' : ''} to join`,
      body: next && !activity.nextMealSent
        ? `Approve them now and they'll get ${monthName}'s meal with everyone else.`
        : 'Approve them so they can see the group page and receive meals.',
      cta: 'Review requests →',
      href: tabHref('people'),
    });
  }
  if (daysSincePost === null || daysSincePost > 30) {
    tasks.push({
      key: 'field',
      eyebrow: lastPost ? `Last update: ${formatDay(lastPost.created_at, { month: 'short', day: 'numeric' })}` : 'No updates yet',
      title: `Share news from ${group.countryName}`,
      body: lastPost
        ? `Your group hasn't heard from the field in ${daysSincePost! >= 60 ? `${Math.floor(daysSincePost! / 30)} months` : `${daysSincePost} days`}. A photo and a prayer request is enough.`
        : 'A short note from the field helps your group pray specifically. A photo and a prayer request is enough.',
      cta: 'Write update →',
      href: tabHref('field'),
    });
  }

  const states = activity.memberStates;
  const peopleLine = activity.members === 0
    ? 'No members yet. Share your group page to invite people to join.'
    : `${plural(activity.members, 'person', 'people')}${states > 1 ? ` in ${states} states` : ''} ${activity.members === 1 ? 'is' : 'are'} gathering monthly to pray for ${group.countryName} with you.`;

  const topState = (() => {
    const counts: Record<string, number> = {};
    for (const m of members.accepted) if (m.state) counts[m.state.trim().toUpperCase()] = (counts[m.state.trim().toUpperCase()] ?? 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? usStateName(top[0]) : null;
  })();

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-wrap gap-8 items-stretch">
        <div className="flex-[999_1_480px] min-w-0 flex flex-col justify-center gap-4">
          <h2 className="font-fraunces font-bold text-[48px] md:text-[64px] leading-[0.95] tracking-[-0.04em] text-black">
            {greeting}
          </h2>
          <p className="font-inter text-lg md:text-xl leading-[1.45] text-[#3A372F] max-w-[540px]">{peopleLine}</p>
        </div>
        <div className="flex-[1_1_340px] bg-dark text-cream p-6 md:p-7 flex flex-col gap-4">
          <p className="font-inter font-semibold text-[11px] tracking-[0.12em] uppercase text-[#CFC9BC]">Next gathering</p>
          {next ? (
            <>
              <div>
                <p className="font-fraunces font-bold text-[36px] md:text-[42px] leading-none tracking-[-0.03em]">{formatDay(next)}</p>
                <p className="font-inter text-[15px] text-[#CFC9BC] mt-2">
                  {group.time}
                  {days !== null && days >= 0 && ` · ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `${days} days away`}`}
                </p>
              </div>
              <p className={`flex gap-2.5 items-center font-inter font-semibold text-sm border-t border-[#4A4740] pt-3.5 ${activity.nextMealSent ? 'text-cream' : 'text-[#F2B38E]'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  {activity.nextMealSent ? <path d="M5 12l5 5L20 7" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></>}
                </svg>
                {activity.nextMealSent ? `${monthName} meal sent` : `${monthName} meal not sent yet`}
              </p>
            </>
          ) : (
            <p className="font-inter text-[15px] text-[#CFC9BC]">Set your group&apos;s schedule in Settings to see your next gathering.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="border-t-2 border-black pt-3.5">
          <SectionLabel>{tasks.length ? `This month · ${plural(tasks.length, 'thing')} need${tasks.length === 1 ? 's' : ''} you` : 'This month'}</SectionLabel>
        </div>
        {tasks.length === 0 ? (
          <p className="font-inter text-base text-warm border-2 border-black p-6">
            You&apos;re all caught up. {next ? `${monthName}'s meal is on its way, ` : ''}requests are answered, and your group has heard from the field recently.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            {tasks.map((t) => (
              <article key={t.key} className="border-2 border-black p-6 flex flex-col gap-3">
                <p className={`font-inter font-semibold text-[11px] tracking-[0.12em] uppercase ${t.urgent ? 'text-[#8A3A12]' : 'text-warm'}`}>{t.eyebrow}</p>
                <h3 className="font-fraunces font-semibold text-[25px] leading-[1.1] tracking-[-0.02em] text-black">{t.title}</h3>
                <p className="font-inter text-[15px] leading-normal text-warm flex-grow">{t.body}</p>
                <Link href={t.href} className={`self-start ${t.primary ? btnPrimary : btnSecondary}`}>{t.cta}</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <GatheringSection {...props} />

      <section className="border-2 border-black bg-cream-dark px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-x-9 gap-y-3 font-inter text-sm text-black">
          <span><strong className="font-fraunces text-[22px]">{activity.members}</strong> members{topState ? `, mostly ${topState}` : ''}</span>
          <span><strong className="font-fraunces text-[22px]">{activity.mealsSent}</strong> {activity.mealsSent === 1 ? 'meal' : 'meals'} shared</span>
          {activity.latestMeal ? (
            <span><strong className="font-fraunces text-[22px]">{activity.latestMeal.opened}/{activity.latestMeal.recipients}</strong> opened {activity.latestMeal.label}&apos;s meal</span>
          ) : (
            <span><strong className="font-fraunces text-[22px]">{fieldPosts.length}</strong> field {fieldPosts.length === 1 ? 'update' : 'updates'}</span>
          )}
        </div>
        <Link href={tabHref('insights')} className="inline-flex items-center min-h-[44px] font-inter font-semibold text-[13px] tracking-[0.06em] uppercase border-b-2 border-black text-black hover:text-warm">
          See insights →
        </Link>
      </section>
    </div>
  );
}
