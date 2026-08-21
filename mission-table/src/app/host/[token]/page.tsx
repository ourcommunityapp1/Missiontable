import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { getHostByToken, getMembersForGroup, getKitsForGroup, getFieldPostsForGroup, type HostGroup } from '@/lib/queries';
import { approveMember, updateChatLink } from './actions';
import ResendKitButton from './ResendKitButton';

export const dynamic = 'force-dynamic';

async function GroupSection({ group, token, hostName }: { group: HostGroup; token: string; hostName: string }) {
  const [members, kits, fieldPosts] = await Promise.all([
    getMembersForGroup(group.id),
    getKitsForGroup(group.id),
    getFieldPostsForGroup(group.id),
  ]);
  const groupDisplayName = group.name ?? hostName;

  return (
    <div className="flex flex-col gap-12">

      {/* ── Your Group ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between border-t-2 border-black pt-4 mb-6">
          <h2 className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
            Group Details
          </h2>
          <Link
            href={`/host/${token}/group/${group.id}/edit`}
            className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-b-2 border-black pb-0.5 hover:text-warm transition-colors"
          >
            Edit Details →
          </Link>
        </div>

        <div className="border-2 border-black p-5">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Country</p>
              <p className="font-inter text-sm text-warm">{group.countryName}</p>
            </div>
            <div>
              <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Status</p>
              <p className={`font-inter text-sm font-semibold ${group.status === 'active' ? 'text-accent' : 'text-warm'}`}>
                {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
              </p>
            </div>
            <div>
              <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Rhythm</p>
              <p className="font-inter text-sm text-warm">{group.rhythm}</p>
            </div>
            <div>
              <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Time</p>
              <p className="font-inter text-sm text-warm">{group.time}</p>
            </div>
            <div className="col-span-2">
              <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">Group Chat Link</p>
              {group.chat_link ? (
                <p className="font-inter text-sm text-warm break-all">{group.chat_link}</p>
              ) : (
                <p className="font-inter text-sm text-warm italic">None set</p>
              )}
            </div>
          </div>

          {/* Edit chat link */}
          <form
            action={async (formData: FormData) => {
              'use server';
              const link = (formData.get('chat_link') as string)?.trim() || null;
              await updateChatLink(group.id, link);
              revalidatePath(`/host/${token}`);
            }}
            className="flex gap-3 items-end border-t-2 border-black pt-4"
          >
            <div className="flex-1">
              <label className="block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                Update Chat Link
              </label>
              <input
                name="chat_link"
                type="url"
                defaultValue={group.chat_link ?? ''}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none focus:border-black"
              />
            </div>
            <button
              type="submit"
              className="font-inter font-semibold text-sm tracking-[0.05em] uppercase border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
              Save
            </button>
          </form>
        </div>
      </section>

      {/* ── Members ───────────────────────────────────── */}
      <section>
        <h2 className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black border-t-2 border-black pt-4 mb-6">
          Members
        </h2>

        {members.pending.length > 0 && (
          <div className="mb-8">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-3">
              Pending ({members.pending.length})
            </p>
            <div className="flex flex-col">
              {members.pending.map((m) => (
                <div key={m.membershipId} className="flex items-start justify-between gap-4 border-t-2 border-black py-4 last:border-b-2">
                  <div>
                    <p className="font-inter font-semibold text-sm text-black">{m.name}</p>
                    <p className="font-inter text-sm text-warm">{m.email}</p>
                    {m.phone && <p className="font-inter text-xs text-warm">{m.phone}</p>}
                    {m.church && <p className="font-inter text-xs text-warm">{m.church}</p>}
                    {(m.city || m.state) && (
                      <p className="font-inter text-xs text-warm">
                        {[m.city, m.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <form
                    action={async () => {
                      'use server';
                      await approveMember(m.membershipId, group.id);
                      revalidatePath(`/host/${token}`);
                    }}
                  >
                    <button
                      type="submit"
                      className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-2 border-black px-3 py-2 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
                    >
                      Approve →
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {members.accepted.length > 0 ? (
          <div>
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-3">
              Accepted ({members.accepted.length})
            </p>
            <div className="flex flex-col">
              {members.accepted.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 border-t-2 border-black py-3 last:border-b-2">
                  <p className="font-inter font-semibold text-sm text-black">{m.name}</p>
                  <p className="font-inter text-sm text-warm">
                    {[m.city, m.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : members.pending.length === 0 ? (
          <p className="font-inter text-base text-warm">No members yet. Share your group link to get started.</p>
        ) : null}
      </section>

      {/* ── Meals ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between border-t-2 border-black pt-4 mb-6">
          <h2 className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
            Meals
          </h2>
          <Link
            href={`/host/${token}/kit/new?groupId=${group.id}`}
            className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-b-2 border-black pb-0.5 hover:text-warm transition-colors"
          >
            Create This Month's Meal →
          </Link>
        </div>

        {kits.length === 0 ? (
          <p className="font-inter text-base text-warm">
            No meals yet. Create your first meal to send your group a recipe, scripture, and prayer requests.
          </p>
        ) : (
          <div className="flex flex-col">
            {kits.map((kit) => (
              <div key={kit.id} className="flex items-start justify-between gap-4 border-t-2 border-black py-4 last:border-b-2">
                <div>
                  <p className="font-inter font-semibold text-sm text-black">
                    {new Date(kit.meeting_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {kit.recipe_name && (
                    <p className="font-inter text-sm text-warm">{kit.recipe_name}</p>
                  )}
                  {kit.scripture_reference && (
                    <p className="font-inter text-xs text-warm">{kit.scripture_reference}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/host/${token}/kit/${kit.id}/edit`}
                    className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-2 border-black px-3 py-2 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
                  >
                    Edit →
                  </Link>
                  <ResendKitButton
                    kitId={kit.id}
                    groupId={group.id}
                    groupDisplayName={groupDisplayName}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── From the Field ────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between border-t-2 border-black pt-4 mb-6">
          <h2 className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
            From the Field
          </h2>
          <Link
            href={`/host/${token}/field-post/new?groupId=${group.id}`}
            className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-b-2 border-black pb-0.5 hover:text-warm transition-colors"
          >
            New Post →
          </Link>
        </div>

        {fieldPosts.length === 0 ? (
          <p className="font-inter text-base text-warm">
            No updates yet. Share a note from your mission partner in the field.
          </p>
        ) : (
          <div className="flex flex-col">
            {fieldPosts.map((post) => (
              <div key={post.id} className="border-t-2 border-black py-4 last:border-b-2">
                <p className="font-inter font-semibold text-sm text-black">{post.author_label}</p>
                <p className="font-inter text-sm text-warm mt-1 line-clamp-2">{post.body}</p>
                <p className="font-inter text-xs text-warm mt-1">
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {' · '}{post.reactionCount} praying · {post.comments.length} comments
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default async function HostDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getHostByToken(token);
  if (!data) notFound();

  const { host, groups } = data;

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">

        {/* Header */}
        <div className="border-t-2 border-black pt-4 mb-12">
          <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-2">
            Host Dashboard
          </p>
          <h1 className="font-fraunces font-bold text-[48px] md:text-[64px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-black mb-2">
            {host.name}
          </h1>
          <p className="font-inter text-base text-warm">Welcome back, {host.name}.</p>
        </div>

        {groups.length === 0 ? (
          <p className="font-inter text-base text-warm max-w-[600px]">
            Your group is pending review. You'll receive an email once it's approved.
          </p>
        ) : groups.length === 1 ? (
          <div className="max-w-[800px]">
            <GroupSection group={groups[0]} token={token} hostName={host.name} />
          </div>
        ) : (
          <div className="flex flex-col gap-24">
            {groups.map((group) => (
              <div key={group.id} className="max-w-[800px]">
                <div className="mb-8">
                  <h2 className="font-fraunces font-bold text-[32px] uppercase leading-none tracking-[-0.03em] fraunces-32 text-black">
                    {group.name ?? group.countryName}
                  </h2>
                  <p className="font-inter text-sm text-warm mt-1">{group.countryName}</p>
                </div>
                <GroupSection group={group} token={token} hostName={host.name} />
              </div>
            ))}
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
