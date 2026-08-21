import { notFound } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { getHostByToken } from '@/lib/queries';
import GroupEditForm from './GroupEditForm';

export const dynamic = 'force-dynamic';

export default async function GroupEditPage({
  params,
}: {
  params: Promise<{ token: string; groupId: string }>;
}) {
  const { token, groupId } = await params;
  const data = await getHostByToken(token);
  if (!data) notFound();

  const group = data.groups.find((g) => g.id === groupId);
  if (!group) notFound();

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">
        <div className="max-w-[640px]">

          <div className="border-t-2 border-black pt-4 mb-8">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-2">
              Host Dashboard · Edit Group
            </p>
            <h1 className="font-fraunces font-bold text-[48px] uppercase leading-none tracking-[-0.04em] text-black">
              {group.name ?? group.countryName}
            </h1>
          </div>

          <GroupEditForm group={group} token={token} />

        </div>
      </div>

      <Footer />
    </main>
  );
}
