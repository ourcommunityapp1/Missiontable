import { notFound } from 'next/navigation';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { getHostByToken, generateMeetingDates } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import type { KitRow } from '@/lib/database.types';
import KitEditForm from './KitEditForm';

export const dynamic = 'force-dynamic';

export default async function KitEditPage({
  params,
}: {
  params: Promise<{ token: string; kitId: string }>;
}) {
  const { token, kitId } = await params;
  const data = await getHostByToken(token);
  if (!data || data.groups.length === 0) notFound();

  const { host, groups } = data;

  const { data: kit } = await supabase
    .from('kits')
    .select('*')
    .eq('id', kitId)
    .single() as unknown as { data: KitRow | null };

  if (!kit) notFound();

  // Verify this kit belongs to one of the host's groups
  const group = groups.find((g) => g.id === kit.group_id);
  if (!group) notFound();

  const meetingDates = generateMeetingDates(
    group.rhythm_type,
    group.day_of_month,
    group.week_of_month,
    group.day_of_week,
    6,
  );

  const groupDisplayName = group.name ?? host.name;

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">

        {/* Back nav */}
        <div className="mb-8">
          <Link
            href={`/host/${token}`}
            className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
          >
            <span aria-hidden="true">←</span>
            Dashboard
          </Link>
        </div>

        <div className="max-w-[640px]">
          <div className="border-t-2 border-black pt-4 mb-10">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-2">
              {groupDisplayName}
            </p>
            <h1 className="font-fraunces font-bold text-[48px] md:text-[56px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-black">
              Edit Kit
            </h1>
            <p className="font-inter text-sm text-warm mt-2">
              {new Date(kit.meeting_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <KitEditForm token={token} kit={kit} meetingDates={meetingDates} />
        </div>
      </div>

      <Footer />
    </main>
  );
}
