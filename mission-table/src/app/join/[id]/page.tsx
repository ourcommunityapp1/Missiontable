import { notFound } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { getGroupById } from '@/lib/queries';
import JoinGroupForm from './JoinGroupForm';

export const dynamic = 'force-dynamic';

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await getGroupById(id);
  if (!group) notFound();

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />
      <JoinGroupForm group={group} />
      <Footer />
    </main>
  );
}
