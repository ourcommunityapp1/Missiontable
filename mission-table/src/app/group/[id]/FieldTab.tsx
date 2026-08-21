'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { FieldPostWithEngagement } from '@/lib/queries';
import { toggleFieldPostReaction, addFieldPostComment, deleteFieldPostComment } from './actions';

type Props = {
  posts: FieldPostWithEngagement[];
  token: string;
  currentMemberId: string;
  countryName: string;
};

type LocalComment = { id: string; body: string; member_id: string; memberName: string };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export default function FieldTab({ posts, token, currentMemberId, countryName }: Props) {
  const [reactions, setReactions] = useState<Record<string, { count: number; active: boolean }>>(
    () => Object.fromEntries(posts.map((p) => [p.id, { count: p.reactionCount, active: p.reactedMemberIds.includes(currentMemberId) }])),
  );
  const [comments, setComments] = useState<Record<string, LocalComment[]>>(
    () => Object.fromEntries(posts.map((p) => [p.id, p.comments])),
  );
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  async function handleReact(postId: string) {
    setError('');
    const result = await toggleFieldPostReaction(token, postId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setReactions((prev) => ({ ...prev, [postId]: { count: result.count, active: result.active } }));
  }

  async function handleAddComment(postId: string) {
    const body = (drafts[postId] ?? '').trim();
    if (!body) return;
    setError('');
    const result = await addFieldPostComment(token, postId, body);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), { id: result.comment.id, body: result.comment.body, member_id: result.comment.member_id, memberName: result.comment.memberName }],
    }));
    setDrafts((prev) => ({ ...prev, [postId]: '' }));
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    setError('');
    const result = await deleteFieldPostComment(token, postId, commentId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setComments((prev) => ({ ...prev, [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId) }));
  }

  if (posts.length === 0) {
    return <p className="font-inter text-base text-warm">No updates yet.</p>;
  }

  const leadAuthor = posts[0].author_label;

  return (
    <div className="flex flex-col gap-6 max-w-[640px]">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full border-2 border-black bg-cream-dark flex items-center justify-center font-fraunces text-xs text-black flex-none">
          {initials(leadAuthor)}
        </div>
        <p className="font-inter text-sm text-warm">
          Updates from <strong className="text-black">{leadAuthor}</strong>, your mission partners serving in {countryName}
        </p>
      </div>

      {posts.map((post) => {
        const reaction = reactions[post.id] ?? { count: 0, active: false };
        const postComments = comments[post.id] ?? [];
        const isOpen = !!openComments[post.id];

        return (
          <article key={post.id} className="border-2 border-black bg-cream">
            {(post.photo_url || post.video_url) && (
              post.video_url ? (
                <a
                  href={post.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full h-[220px] border-b-2 border-black block bg-ink"
                  style={{ backgroundColor: '#1C1B1B' }}
                  aria-label={`Watch video from ${post.author_label}`}
                >
                  {post.photo_url && <Image src={post.photo_url} alt={post.author_label} fill unoptimized className="object-cover" />}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-cream/95 border-2 border-black flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="#1C1B1B" className="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <span className="absolute left-3 bottom-3 font-inter text-xs font-semibold text-cream">Watch Video ↗</span>
                </a>
              ) : (
                <div className="relative w-full h-[220px] border-b-2 border-black">
                  <Image src={post.photo_url!} alt={post.author_label} fill unoptimized className="object-cover" />
                </div>
              )
            )}

            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-inter font-semibold text-sm text-black">{post.author_label}</p>
                <p className="font-inter text-xs text-muted">{formatDate(post.created_at)}</p>
              </div>

              {post.photo_url || post.video_url ? (
                <p className="font-inter text-sm text-warm whitespace-pre-line leading-[1.6]">{post.body}</p>
              ) : (
                <div>
                  <span aria-hidden="true" className="block font-fraunces font-bold text-3xl leading-[0.6] text-accent fraunces-48 mb-1.5">&#8220;</span>
                  <p className="font-fraunces text-base leading-[1.55] text-black whitespace-pre-line fraunces-32">{post.body}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-black/20">
                <button
                  type="button"
                  onClick={() => handleReact(post.id)}
                  className={`inline-flex items-center gap-1.5 border-2 border-black px-3 py-1.5 font-inter text-xs font-semibold transition-colors ${
                    reaction.active ? 'bg-accent text-cream border-accent' : 'bg-cream text-black hover:bg-black hover:text-cream'
                  }`}
                >
                  🙏 {reaction.count} Praying
                </button>
                <button
                  type="button"
                  onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                  className="inline-flex items-center gap-1.5 border-2 border-black px-3 py-1.5 font-inter text-xs font-semibold bg-cream text-black hover:bg-black hover:text-cream transition-colors"
                >
                  💬 {postComments.length} {postComments.length === 1 ? 'Comment' : 'Comments'}
                </button>
              </div>

              {isOpen && (
                <div className="pt-3 border-t border-black/20 flex flex-col gap-3">
                  {postComments.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-2">
                      <p className="font-inter text-sm text-warm">
                        <span className="font-semibold text-black">{c.memberName}</span> {c.body}
                      </p>
                      {c.member_id === currentMemberId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(post.id, c.id)}
                          className="font-inter text-xs text-muted hover:text-black transition-colors flex-shrink-0"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={drafts[post.id] ?? ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(post.id); } }}
                      placeholder="Add a comment…"
                      className="flex-1 border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-2 border-black px-4 hover:bg-black hover:text-cream transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {error && <p className="font-inter text-sm border-2 border-black px-4 py-3 bg-white">{error}</p>}
    </div>
  );
}
