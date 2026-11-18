import FieldPostNewForm from '../field-post/new/FieldPostNewForm';
import { type DashboardData, SectionLabel, formatDay, plural } from './shared';

export default function FieldTab({ token, group, activity, fieldPosts, tabHref }: DashboardData) {
  return (
    <div className="flex flex-wrap gap-8">
      <section className="flex-[1_1_440px] min-w-0 self-start border-2 border-black bg-cream-dark p-6 md:p-7 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="font-fraunces font-semibold text-[26px] md:text-[28px] leading-[1.15] tracking-[-0.02em] text-black">
            What is God doing in {group.countryName} this month?
          </h2>
          <p className="font-inter text-sm text-warm">
            Posts to your group page for {plural(activity.members, 'member')}. Only your group sees it.
          </p>
        </div>
        <FieldPostNewForm token={token} groupId={group.id} redirectTo={tabHref('field')} />
      </section>

      <section className="flex-[1_1_420px] min-w-0 flex flex-col">
        <div className="mb-1">
          <SectionLabel>Your past updates</SectionLabel>
        </div>
        {fieldPosts.length === 0 ? (
          <p className="font-inter text-base text-warm border-t-2 border-black pt-5">
            No updates yet. Your first one will show here, with how members responded.
          </p>
        ) : (
          fieldPosts.map((post, i) => {
            const responded = post.reactionCount + post.comments.length > 0;
            return (
              <article key={post.id} className={`${i === 0 ? 'border-t-2' : 'border-t'} border-black last:border-b py-5 flex flex-col gap-2`}>
                <p className="font-inter text-xs text-warm">
                  {formatDay(post.created_at, { month: 'short', day: 'numeric', year: 'numeric' })} · {post.author_label}
                </p>
                <p className="font-inter text-base leading-normal text-black whitespace-pre-line line-clamp-4">{post.body}</p>
                <p className={`font-inter text-[13px] ${responded ? 'text-[#8A3A12] font-semibold' : 'text-warm'}`}>
                  {responded ? `${post.reactionCount} praying · ${plural(post.comments.length, 'comment')}` : 'No responses yet'}
                </p>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
