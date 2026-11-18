import { MEMBER_VISIT_TRACKING_START } from '@/lib/queries';
import { type DashboardData, SectionLabel, formatDay, plural } from './shared';

function monthsRunning(startDate: string): number {
  const s = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  return Math.max(1, (now.getFullYear() - s.getFullYear()) * 12 + now.getMonth() - s.getMonth() + 1);
}

function numberWord(n: number): string {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  return words[n] ?? String(n);
}

export default function InsightsTab({ group, activity, fieldPosts, kits, gatheredByKit }: DashboardData) {
  const months = monthsRunning(group.start_date);
  const range = [...activity.months].reverse(); // oldest first
  const rangeLabel = `${range[0]?.label ?? ''} – ${range[range.length - 1]?.label ?? ''}`;
  const trackedFrom = formatDay(MEMBER_VISIT_TRACKING_START, { month: 'long', day: 'numeric', year: 'numeric' });

  // Members over time (SVG line)
  const growth = activity.membersByMonth;
  const gMax = Math.max(1, ...growth.map((g) => g.count));
  const gx = (i: number) => (growth.length === 1 ? 240 : 40 + (i * 400) / (growth.length - 1));
  const gy = (v: number) => 165 - (v / gMax) * 130;
  const linePts = growth.map((g, i) => `${gx(i)},${gy(g.count)}`).join(' ');
  const areaPts = `${gx(0)},165 ${linePts} ${gx(growth.length - 1)},165`;

  // Monthly rhythm: member visits (tracked months) + meal markers
  // Scale against the member count so a bar reads as "members out of N".
  const vMax = Math.max(1, activity.members, ...range.map((m) => m.memberVisitors ?? 0));

  // Takeaways
  const top = [...fieldPosts].sort((a, b) => b.reactionCount + b.comments.length - (a.reactionCount + a.comments.length))[0];
  const topResponses = top ? top.reactionCount + top.comments.length : 0;
  const totalGathered = kits.reduce((sum, k) => sum + (gatheredByKit[k.id] ?? 0), 0);
  const avgGathered = kits.length ? totalGathered / kits.length : 0;
  const recentJoins = activity.months.slice(0, 3).reduce((sum, m) => sum + m.newMembers, 0);

  const stats = [
    { v: months, l: `${months === 1 ? 'month' : 'months'} praying for ${group.countryName}` },
    { v: activity.members, l: `members${activity.memberStates > 1 ? ` in ${activity.memberStates} states` : ''}` },
    { v: activity.mealsSent, l: activity.mealsSent === 1 ? 'meal shared' : 'meals shared' },
    { v: fieldPosts.length, l: fieldPosts.length === 1 ? 'update from the field' : 'updates from the field' },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <p className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-warm">{rangeLabel}</p>
        <h2 className="font-fraunces font-semibold text-[30px] md:text-[40px] leading-[1.1] tracking-[-0.03em] text-black max-w-[820px]">
          {numberWord(months)} {months === 1 ? 'month' : 'months'}, {numberWord(activity.mealsSent).toLowerCase()} shared {activity.mealsSent === 1 ? 'meal' : 'meals'}, and {plural(activity.members, 'person', 'people')} praying for {group.countryName}.
        </h2>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="border-2 border-black p-4 md:p-5 flex flex-col gap-1">
            <span className="font-fraunces font-bold text-[32px] md:text-[40px] leading-none text-black">{s.v}</span>
            <span className="font-inter text-[13px] text-warm">{s.l}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-5">
        <figure className="flex-[999_1_520px] min-w-0 border-2 border-black p-5 md:p-6 flex flex-col gap-4">
          <figcaption className="flex flex-col gap-1">
            <SectionLabel as="p">Month by month</SectionLabel>
            <span className="font-fraunces text-[22px] tracking-[-0.02em] text-black">Member visits and meals</span>
          </figcaption>
          <div
            role="img"
            aria-label={range.map((m) => `${m.label}: ${m.meal ? 'meal sent' : 'no meal'}, ${m.visits === null ? 'visits not tracked yet' : `${m.memberVisitors} members visited`}`).join('; ')}
            className="grid gap-3 items-end h-[220px] border-b-2 border-black"
            style={{ gridTemplateColumns: `repeat(${range.length}, minmax(0, 1fr))` }}
          >
            {range.map((m) => (
              <div key={m.key} className="flex flex-col items-center justify-end gap-1.5 h-full">
                <span className="font-inter text-[13px] font-semibold text-black">{m.memberVisitors ?? '—'}</span>
                {m.memberVisitors === null ? (
                  <span className="w-full h-6 border-2 border-dashed border-[#C9C3B5] border-b-0 block" />
                ) : (
                  <span className={`w-full block ${m.meal ? 'bg-black' : 'bg-[#C9C3B5]'}`} style={{ height: `${Math.max(4, ((m.memberVisitors ?? 0) / vMax) * 180)}px` }} />
                )}
              </div>
            ))}
          </div>
          <div className="grid gap-3 -mt-2" style={{ gridTemplateColumns: `repeat(${range.length}, minmax(0, 1fr))` }}>
            {range.map((m) => (
              <div key={m.key} className="flex flex-col items-center gap-1 font-inter text-xs text-center">
                <span className="font-semibold text-black">{m.label.split(' ')[0]}</span>
                <span className={m.meal ? 'text-[#8A3A12] font-semibold' : 'text-warm'}>{m.meal ? 'Meal' : 'No meal'}</span>
              </div>
            ))}
          </div>
          <p className="font-inter text-xs text-warm">
            Bars show how many of your {activity.members} members opened the group page from their email link that month, counted from {trackedFrom}. Earlier months show “—”.
          </p>
        </figure>

        <div className="flex-[1_1_300px] flex flex-col gap-5">
          {activity.latestMeal ? (
            <figure className="border-2 border-black p-5 md:p-6 flex gap-5 items-center">
              <svg width="112" height="112" viewBox="0 0 120 120" role="img" aria-label={`${activity.latestMeal.opened} of ${activity.latestMeal.recipients} members opened the ${activity.latestMeal.label} meal`} className="shrink-0">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#EAE8E3" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="#8A3A12" strokeWidth="12"
                  strokeDasharray={`${(activity.latestMeal.opened / Math.max(1, activity.latestMeal.recipients)) * 326.7} 326.7`}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="68" textAnchor="middle" fontFamily="var(--font-fraunces), Georgia, serif" fontSize="26" fontWeight="700" fill="#1C1B1B">
                  {activity.latestMeal.opened}/{activity.latestMeal.recipients}
                </text>
              </svg>
              <figcaption className="flex flex-col gap-1.5">
                <SectionLabel as="p">{activity.latestMeal.label} meal</SectionLabel>
                <span className="font-inter text-[15px] leading-[1.45] text-black">
                  {activity.latestMeal.opened} of the {activity.latestMeal.recipients} members it went to have opened the group page since it was sent.
                </span>
              </figcaption>
            </figure>
          ) : (
            <div className="border-2 border-dashed border-warm bg-cream-dark p-5 md:p-6 flex flex-col gap-1.5">
              <SectionLabel as="p">Meal opens</SectionLabel>
              <span className="font-inter text-[15px] leading-[1.45] text-warm">
                After your next meal goes out, you&apos;ll see how many members opened it here.
              </span>
            </div>
          )}

          <figure className="border-2 border-black p-5 md:p-6 flex flex-col gap-3">
            <figcaption><SectionLabel as="p">Members over time</SectionLabel></figcaption>
            <svg viewBox="0 0 480 200" width="100%" role="img" aria-label={growth.map((g) => `${g.label}: ${g.count}`).join(', ')}>
              <polygon points={areaPts} fill="#EAE8E3" />
              <polyline points={linePts} fill="none" stroke="#1C1B1B" strokeWidth="4" />
              {growth.map((g, i) => (
                <g key={g.key} fontFamily="var(--font-inter), sans-serif" fontSize="20" textAnchor="middle">
                  {(i === 0 || g.count !== growth[i - 1].count) && <text x={gx(i)} y={gy(g.count) - 10} fill="#1C1B1B" fontWeight="600">{g.count}</text>}
                  <text x={gx(i)} y="194" fill="#625E53">{g.label}</text>
                </g>
              ))}
            </svg>
          </figure>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <div className="bg-cream-dark border-2 border-black p-5 flex flex-col gap-1.5">
          <SectionLabel as="p">Your updates</SectionLabel>
          <span className="font-inter text-[15px] leading-[1.45] text-black">
            {fieldPosts.length === 0
              ? 'No updates yet. Members pray more specifically when they hear from the field.'
              : topResponses > 0
                ? `${plural(fieldPosts.length, 'update')} posted. Your ${formatDay(top!.created_at, { month: 'long', day: 'numeric' })} update drew the most response: ${top!.reactionCount} praying, ${plural(top!.comments.length, 'comment')}.`
                : `${plural(fieldPosts.length, 'update')} posted, no responses yet. Ending with a specific prayer request invites replies.`}
          </span>
        </div>
        <div className="bg-cream-dark border-2 border-black p-5 flex flex-col gap-1.5">
          <SectionLabel as="p">Gathered marks</SectionLabel>
          <span className="font-inter text-[15px] leading-[1.45] text-black">
            {kits.length === 0
              ? 'Once meals go out, members can mark that they gathered.'
              : `${avgGathered.toFixed(avgGathered % 1 ? 1 : 0)} per meal on average${avgGathered < activity.members / 2 ? '. Most members haven’t tapped “We gathered” yet; a reminder in the meal email could help.' : '.'}`}
          </span>
        </div>
        <div className="bg-cream-dark border-2 border-black p-5 flex flex-col gap-1.5">
          <SectionLabel as="p">Growth</SectionLabel>
          <span className="font-inter text-[15px] leading-[1.45] text-black">
            {recentJoins > 0
              ? `${plural(recentJoins, 'person', 'people')} joined in the last three months.`
              : 'No new members in the last three months. Inviting a friend to the next meal is the easiest way to grow.'}
          </span>
        </div>
      </div>
    </div>
  );
}
