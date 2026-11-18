import { revalidatePath } from 'next/cache';
import { setAutoMessages } from '../actions';
import NoteComposer from './NoteComposer';
import { type DashboardData, SectionLabel, formatDay, plural } from './shared';

export default function GatheringSection({ token, group, loop, members }: DashboardData) {
  if (!loop.nextDate && !loop.thanksNote) return null;
  const memberCount = members.accepted.length;

  return (
    <section id="notes" aria-labelledby="gathering-title" className="flex flex-col gap-5 scroll-mt-6">
      <div className="border-t-2 border-black pt-3.5">
        <SectionLabel>
          <span id="gathering-title">{loop.nextDate ? `Before and after the ${formatDay(loop.nextDate, { month: 'short', day: 'numeric' })} gathering` : 'After your gathering'}</span>
        </SectionLabel>
      </div>

      {!loop.autoMessages && (
        <div className="border-2 border-black bg-cream-dark p-6 flex flex-wrap items-center justify-between gap-5">
          <div className="flex-[999_1_420px] min-w-0 flex flex-col gap-1.5">
            <h3 className="font-fraunces font-semibold text-[22px] text-black">Turn on automatic emails</h3>
            <p className="font-inter text-[15px] leading-normal text-[#3A372F]">
              Three days before each gathering, members get your “Are you in?” note with one-tap answers. The evening after, they get your thank-you with the group’s table photos. We remind you to write each one.
            </p>
          </div>
          <form
            action={async () => {
              'use server';
              await setAutoMessages(token, group.id, true);
              revalidatePath(`/host/${token}`);
            }}
          >
            <button type="submit" className="min-h-[48px] px-6 bg-black text-cream font-inter font-semibold text-[13px] tracking-[0.06em] uppercase">Turn on</button>
          </form>
        </div>
      )}

      {loop.nextDate && (
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          <div className="border-2 border-black p-5 flex flex-col gap-3">
            <h3 className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-black">Who&apos;s in for {formatDay(loop.nextDate, { month: 'short', day: 'numeric' })}</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-black text-cream py-3 px-1"><span className="block font-fraunces text-[28px] font-bold leading-none">{loop.inNames.length}</span><span className="font-inter text-xs">In</span></div>
              <div className="border-2 border-black py-2.5 px-1"><span className="block font-fraunces text-[28px] font-bold leading-none">{loop.outNames.length}</span><span className="font-inter text-xs">Not this month</span></div>
              <div className="border-2 border-dashed border-warm py-2.5 px-1 text-warm"><span className="block font-fraunces text-[28px] font-bold leading-none">{loop.noAnswer}</span><span className="font-inter text-xs">No answer yet</span></div>
            </div>
            {loop.inNames.length > 0 ? (
              <p className="font-inter text-[13px] text-[#3A372F]">In: {loop.inNames.join(', ')}</p>
            ) : (
              <p className="font-inter text-[13px] text-warm">
                {loop.autoMessages && loop.rsvpNote
                  ? `Answers start coming in after your note goes out on ${formatDay(loop.rsvpNote.sendDate, { month: 'short', day: 'numeric' })}.`
                  : 'Members can also answer on their group page.'}
              </p>
            )}
          </div>
          {loop.thanksNote ? null : (
            <div className="border-2 border-dashed border-warm bg-cream-dark p-5 flex flex-col gap-1.5">
              <h3 className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-warm">Then: your thank-you note</h3>
              <p className="font-fraunces text-[21px] text-black">Opens {formatDay(loop.nextDate, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <p className="font-inter text-sm text-warm">It goes out the evening after, with the group&apos;s table photos and prayers ({plural(memberCount, 'member')}).</p>
            </div>
          )}
        </div>
      )}

      {loop.thanksNote && (
        <NoteComposer token={token} groupId={group.id} note={loop.thanksNote} memberCount={memberCount} autoMessages={loop.autoMessages} />
      )}
      {loop.rsvpNote && (
        <NoteComposer token={token} groupId={group.id} note={loop.rsvpNote} memberCount={memberCount} autoMessages={loop.autoMessages} />
      )}
    </section>
  );
}
