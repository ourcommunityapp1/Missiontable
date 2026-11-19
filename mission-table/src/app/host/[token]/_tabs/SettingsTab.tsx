import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { updateChatLink, setAutoMessages } from '../actions';
import { type DashboardData, SectionLabel, formatDay, btnSecondary } from './shared';
import AppEmailSection from './AppEmailSection';

export default function SettingsTab({ token, group, cohosts, app }: DashboardData) {
  const details: { k: string; v: string }[] = [
    { k: 'Group name', v: group.name ?? '—' },
    { k: 'Country', v: group.countryName },
    { k: 'Status', v: group.status.charAt(0).toUpperCase() + group.status.slice(1) },
    { k: 'Type', v: group.group_type === 'virtual' ? 'Virtual · members join from anywhere' : `In person · ${[group.city, group.state].filter(Boolean).join(', ')}` },
    { k: 'Schedule', v: `${group.rhythm} · ${group.time}` },
    { k: 'Started', v: formatDay(group.start_date, { month: 'long', day: 'numeric', year: 'numeric' }) },
    { k: 'Group size', v: group.max_size ? `Up to ${group.max_size}` : 'No limit' },
  ];

  return (
    <div className="flex flex-col gap-10 max-w-[760px]">
      <section className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <SectionLabel>Group details</SectionLabel>
          <Link href={`/host/${token}/group/${group.id}/edit`} className={btnSecondary}>Edit details</Link>
        </div>
        <dl className="flex flex-col">
          {details.map((d) => (
            <div key={d.k} className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-1 sm:gap-6 border-t border-black py-4">
              <dt className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-black">{d.k}</dt>
              <dd className="font-inter text-base text-[#3A372F]">{d.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="app" className="flex flex-col gap-3 scroll-mt-6">
        <SectionLabel>The group app</SectionLabel>
        <AppEmailSection token={token} groupId={group.id} stats={app} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Automatic emails</SectionLabel>
        <div className="border-2 border-black p-5 flex flex-wrap items-center justify-between gap-4">
          <p className="flex-[999_1_360px] font-inter text-sm leading-relaxed text-[#3A372F]">
            {group.auto_messages ? <strong className="text-black">On. </strong> : <strong className="text-black">Off. </strong>}
            Your “Are you in?” note goes to members 3 days before each gathering, and your thank-you the evening after. You get a reminder to write each one.
          </p>
          <form
            action={async () => {
              'use server';
              await setAutoMessages(token, group.id, !group.auto_messages);
              revalidatePath(`/host/${token}`);
            }}
          >
            <button type="submit" className={`min-h-[44px] px-5 font-inter font-semibold text-[13px] tracking-[0.06em] uppercase ${group.auto_messages ? 'border-2 border-black' : 'bg-black text-cream'}`}>
              {group.auto_messages ? 'Turn off' : 'Turn on'}
            </button>
          </form>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Group chat link</SectionLabel>
        <p className="font-inter text-sm text-warm">Members see this on the group page. Use a WhatsApp, GroupMe or Signal invite link.</p>
        <form
          action={async (formData: FormData) => {
            'use server';
            const link = (formData.get('chat_link') as string)?.trim() || null;
            await updateChatLink(token, group.id, link);
            revalidatePath(`/host/${token}`);
          }}
          className="flex flex-wrap gap-3 items-end"
        >
          <label className="flex-[1_1_320px] flex flex-col gap-1">
            <span className="sr-only">Group chat link</span>
            <input
              name="chat_link"
              type="url"
              defaultValue={group.chat_link ?? ''}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full min-h-[44px] border-2 border-black bg-cream font-inter text-sm px-3 outline-none"
            />
          </label>
          <button type="submit" className="min-h-[44px] border-2 border-black px-5 font-inter font-semibold text-[13px] tracking-[0.06em] uppercase hover:bg-black hover:text-cream transition-colors">
            Save
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Hosts</SectionLabel>
        <ul className="flex flex-col">
          {cohosts.map((h, i) => (
            <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-black py-3 last:border-b">
              <span className="font-inter font-semibold text-sm text-black">{h.name}</span>
              <span className="font-inter text-xs text-warm">{i === 0 ? 'Primary host · shown publicly' : 'Co-host'}</span>
            </li>
          ))}
        </ul>
        <p className="font-inter text-sm text-warm">To add a co-host, email projectmissiontable@gmail.com.</p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Group page</SectionLabel>
        <Link href={`/group/${group.id}`} className="self-start font-inter text-sm font-semibold text-black underline underline-offset-4 hover:text-warm">
          View your public group page →
        </Link>
      </section>
    </div>
  );
}
