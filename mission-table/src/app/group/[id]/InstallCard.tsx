'use client';

/** A quiet reminder at the bottom of This month; opens the step-by-step modal. */
export default function InstallCard({ groupName, iconUrl, onShowHow }: { groupName: string; iconUrl: string; onShowHow: () => void }) {
  return (
    <section aria-labelledby="install-title-card" className="border-2 border-dashed border-black bg-cream-dark p-4 flex items-center gap-3.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconUrl} alt="" width={48} height={48} className="w-12 h-12 rounded-[11px] object-cover flex-none" />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h2 id="install-title-card" className="font-fraunces font-semibold text-[18px] leading-tight text-black">Put {groupName} on your phone</h2>
        <p className="font-inter text-[13px] text-[#3A372F]">One tap to your group, like an app.</p>
      </div>
      <button type="button" onClick={onShowHow} className="flex-none min-h-[44px] px-3.5 bg-black text-cream font-inter text-xs font-bold tracking-[0.05em] uppercase">
        Show me how
      </button>
    </section>
  );
}
