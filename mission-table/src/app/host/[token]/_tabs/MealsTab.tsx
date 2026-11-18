import Link from 'next/link';
import ResendKitButton from '../ResendKitButton';
import type { KitRow } from '@/lib/database.types';
import { type DashboardData, formatDay, addDays, btnPrimary } from './shared';

type MonthSlot = { key: string; label: string; kits: KitRow[] };

/** Every month from the group's start (or 12 months back) through the later of now and the latest kit, newest first. */
function monthSlots(startDate: string, kits: KitRow[]): MonthSlot[] {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const latestKitKey = kits.reduce((max, k) => (k.meeting_date.slice(0, 7) > max ? k.meeting_date.slice(0, 7) : max), currentKey);
  const slots: MonthSlot[] = [];
  let [y, m] = latestKitKey.split('-').map(Number);
  const startKey = startDate.slice(0, 7);
  while (slots.length < 12) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (key < startKey) break;
    slots.push({
      key,
      label: new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      kits: kits.filter((k) => k.meeting_date.startsWith(key)),
    });
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
  }
  return slots;
}

export default function MealsTab({ token, group, hostName, kits, activity, gatheredByKit }: DashboardData) {
  const next = activity.nextGathering;
  const newKitHref = `/host/${token}/kit/new?groupId=${group.id}`;
  const groupDisplayName = group.name ?? hostName;
  const slots = monthSlots(group.start_date, kits);

  return (
    <div className="flex flex-col gap-6">
      {next && !activity.nextMealSent ? (
        <div className="border-2 border-black bg-cream-dark px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <p className="font-inter text-base text-black">
            <strong>Next gathering: {formatDay(next)}.</strong>{' '}
            <span className="text-warm">Send the meal by {formatDay(addDays(next, -3))} so members can shop and cook.</span>
          </p>
          <Link href={newKitHref} className={btnPrimary}>Create {formatDay(next, { month: 'long' })} meal</Link>
        </div>
      ) : (
        <div className="flex justify-end">
          <Link href={newKitHref} className={btnPrimary}>Create a meal</Link>
        </div>
      )}

      {slots.length === 0 ? (
        <p className="font-inter text-base text-warm">No meals yet. Your first meal sends members a recipe, scripture and prayer requests.</p>
      ) : (
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {slots.flatMap((slot) =>
            slot.kits.length === 0
              ? [
                  <article key={slot.key} className="border-2 border-dashed border-warm bg-cream-dark p-4 flex flex-col gap-2 min-h-[200px]">
                    <p className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-warm">{slot.label}</p>
                    <p className="font-fraunces text-[19px] leading-[1.15] text-warm flex-grow">No meal sent</p>
                  </article>,
                ]
              : slot.kits.map((kit) => {
                  const gathered = gatheredByKit[kit.id] ?? 0;
                  return (
                    <article key={kit.id} className="border-2 border-black p-4 flex flex-col gap-2 min-h-[200px]">
                      <p className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-black">
                        {formatDay(kit.meeting_date, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="font-fraunces font-semibold text-[19px] leading-[1.15] text-black flex-grow">{kit.recipe_name ?? 'Meal sent'}</p>
                      {kit.scripture_reference && <p className="font-inter text-xs text-warm">{kit.scripture_reference}</p>}
                      <p className="font-inter text-xs font-semibold text-[#8A3A12]">{gathered} gathered</p>
                      <div className="flex gap-2 pt-1">
                        <Link
                          href={`/host/${token}/kit/${kit.id}/edit`}
                          className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-2 border-black px-3 py-2 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
                        >
                          Edit →
                        </Link>
                        <ResendKitButton token={token} kitId={kit.id} groupId={group.id} groupDisplayName={groupDisplayName} />
                      </div>
                    </article>
                  );
                }),
          )}
        </div>
      )}
    </div>
  );
}
