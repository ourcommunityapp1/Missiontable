import Link from 'next/link';
import { getGroupActivity, MEMBER_VISIT_TRACKING_START, type HostGroup } from '@/lib/queries';

function formatGathering(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border-2 border-black p-4">
      <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">{label}</p>
      <p className="font-fraunces font-bold text-[28px] leading-none text-black">{value}</p>
      {note && <p className="font-inter text-xs text-warm mt-1">{note}</p>}
    </div>
  );
}

export default async function GroupActivity({ group, token }: { group: HostGroup; token: string }) {
  const a = await getGroupActivity(group);
  const trackingLabel = new Date(`${MEMBER_VISIT_TRACKING_START}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const lastMonthWithMeal = a.months.find((m) => m.meal);

  return (
    <section>
      <h2 className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black border-t-2 border-black pt-4 mb-6">
        Activity
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Members" value={a.members} note={a.pending ? `${a.pending} waiting for approval` : undefined} />
        <Stat label="Meals sent" value={a.mealsSent} note={lastMonthWithMeal ? `Last: ${lastMonthWithMeal.label}` : undefined} />
        <Stat
          label="Next gathering"
          value={a.nextGathering ? formatGathering(a.nextGathering) : '—'}
          note={a.nextGathering ? (a.nextMealSent ? 'Meal sent' : 'Meal not sent yet') : undefined}
        />
        <Stat
          label="Member visits"
          value={a.months[0].memberVisitors ?? '—'}
          note={a.months[0].memberVisitors === 1 ? 'member this month' : 'members this month'}
        />
      </div>

      {a.nextGathering && !a.nextMealSent && (
        <div className="border-2 border-black bg-black text-white p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="font-inter text-sm">
            No meal has gone out for {formatGathering(a.nextGathering)} yet. Members visit the group page most in months a meal is sent.
          </p>
          <Link
            href={`/host/${token}/kit/new?groupId=${group.id}`}
            className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-2 border-white px-3 py-2 whitespace-nowrap self-start hover:bg-white hover:text-black transition-colors"
          >
            Create meal →
          </Link>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] font-inter text-sm">
          <thead>
            <tr className="text-left border-b-2 border-black">
              {['Month', 'New members', 'Meal', 'Gathered', 'Field updates', 'Member visits'].map((h) => (
                <th key={h} className="py-2 pr-3 text-[10px] font-semibold tracking-[0.1em] uppercase text-black whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {a.months.map((m) => (
              <tr key={m.key} className="border-b border-black/20 align-top">
                <td className="py-2 pr-3 font-semibold text-black whitespace-nowrap">{m.label}</td>
                <td className="py-2 pr-3 text-warm">{m.newMembers || '—'}</td>
                <td className="py-2 pr-3 text-warm">{m.meal ?? <span className="italic">None</span>}</td>
                <td className="py-2 pr-3 text-warm">{m.meal ? m.gathered : '—'}</td>
                <td className="py-2 pr-3 text-warm">{m.reactions + m.comments
                    ? [m.reactions && `${m.reactions} ${m.reactions === 1 ? 'reaction' : 'reactions'}`, m.comments && `${m.comments} ${m.comments === 1 ? 'comment' : 'comments'}`].filter(Boolean).join(', ')
                    : '—'}</td>
                <td className="py-2 pr-3 text-warm whitespace-nowrap">
                  {m.memberVisitors === null ? '—' : m.visits ? `${m.memberVisitors} (${m.visits} ${m.visits === 1 ? 'visit' : 'visits'})` : '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-inter text-xs text-warm mt-3">
        Member visits count members who opened the group page from their email link, starting {trackingLabel}.
      </p>
    </section>
  );
}
