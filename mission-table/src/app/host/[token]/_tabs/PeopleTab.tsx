import { revalidatePath } from 'next/cache';
import { approveMember } from '../actions';
import { normalizeUsState, usStateName } from '@/lib/queries';
import { type DashboardData, SectionLabel, initials, plural } from './shared';

export default function PeopleTab({ token, group, members }: DashboardData) {
  const { accepted, pending } = members;

  const counts: Record<string, number> = {};
  let notShared = 0;
  for (const m of accepted) {
    const st = normalizeUsState(m.state);
    if (st) counts[st] = (counts[st] ?? 0) + 1;
    else notShared += 1;
  }
  const places = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([code, n]) => ({ name: usStateName(code), n, muted: false }));
  if (notShared) places.push({ name: 'Not shared', n: notShared, muted: true });
  const max = Math.max(1, ...places.map((p) => p.n));

  return (
    <div className="flex flex-col gap-10">
      {pending.length > 0 && (
        <section className="border-2 border-black px-6 py-5 flex flex-col gap-4">
          <SectionLabel>{plural(pending.length, 'request')} waiting</SectionLabel>
          {pending.map((m) => (
            <div key={m.membershipId} className="flex flex-wrap items-center justify-between gap-4 border-t border-black pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-inter font-semibold text-base text-black">{m.name}</span>
                <span className="font-inter text-sm text-warm break-all">{m.email}{m.phone ? ` · ${m.phone}` : ''}</span>
                <span className="font-inter text-[13px] text-warm">
                  {[[m.city, m.state].filter(Boolean).join(', '), m.church].filter(Boolean).join(' · ')}
                </span>
              </div>
              <form
                action={async () => {
                  'use server';
                  await approveMember(token, m.membershipId, group.id);
                  revalidatePath(`/host/${token}`);
                }}
              >
                <button type="submit" className="min-h-[44px] bg-black text-cream font-inter font-semibold text-[13px] tracking-[0.06em] uppercase px-5 hover:bg-[#3A372F] transition-colors">
                  Approve
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-8">
        <section className="flex-[999_1_520px] min-w-0 flex flex-col gap-4">
          <SectionLabel>{plural(accepted.length, 'member')}</SectionLabel>
          {accepted.length === 0 ? (
            <p className="font-inter text-base text-warm">No members yet. Share your group page to invite people.</p>
          ) : (
            <ul className="grid gap-x-6 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
              {accepted.map((m) => (
                <li key={m.id} className="flex items-center gap-3 border-t border-black py-3">
                  <span aria-hidden="true" className="w-11 h-11 shrink-0 rounded-full border-2 border-black bg-cream-dark inline-flex items-center justify-center font-inter font-semibold text-[13px] text-black">
                    {initials(m.name)}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="font-inter font-semibold text-sm text-black truncate">{m.name}</span>
                    <span className="font-inter text-xs text-warm truncate">{[m.city, m.state].filter(Boolean).join(', ') || 'Location not shared'}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {places.length > 0 && (
          <section className="flex-[1_1_280px] flex flex-col gap-3">
            <SectionLabel>Where they are</SectionLabel>
            {places.map((p) => (
              <div key={p.name} className="grid grid-cols-[110px_minmax(0,1fr)_28px] items-center gap-3 font-inter text-sm text-black">
                <span className="truncate">{p.name}</span>
                <span className="h-3 bg-cream-border block" aria-hidden="true">
                  <span className={`block h-3 ${p.muted ? 'bg-[#C9C3B5]' : 'bg-black'}`} style={{ width: `${(p.n / max) * 100}%` }} />
                </span>
                <span className="text-right font-semibold">{p.n}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
