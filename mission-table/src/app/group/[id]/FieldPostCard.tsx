'use client';

import { useState } from 'react';
import Image from 'next/image';
import VideoEmbed from '@/components/VideoEmbed';
import { initialsOf } from '@/lib/people';
import type { FieldPostWithEngagement } from '@/lib/queries';
import { toggleFieldPostReaction, addFieldPostComment, deleteFieldPostComment } from './actions';

type Comment = { id: string; body: string; member_id: string; memberName: string };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** A field update from the group's missionaries, with Praying and replies. */
export default function FieldPostCard({ post, token, currentMemberId, countryName }: {
  post: FieldPostWithEngagement;
  token: string;
  currentMemberId: string;
  countryName: string;
}) {
  const [reaction, setReaction] = useState({ count: post.reactionCount, active: post.reactedMemberIds.includes(currentMemberId) });
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  async function react() {
    setError('');
    const res = await toggleFieldPostReaction(token, post.id);
    if (!res.success) return setError(res.error);
    setReaction({ count: res.count, active: res.active });
  }

  async function addComment() {
    const body = draft.trim();
    if (!body) return;
    setError('');
    const res = await addFieldPostComment(token, post.id, body);
    if (!res.success) return setError(res.error);
    setComments((c) => [...c, { id: res.comment.id, body: res.comment.body, member_id: res.comment.member_id, memberName: res.comment.memberName }]);
    setDraft('');
  }

  async function removeComment(id: string) {
    setError('');
    const res = await deleteFieldPostComment(token, post.id, id);
    if (!res.success) return setError(res.error);
    setComments((c) => c.filter((x) => x.id !== id));
  }

  return (
    <article aria-label={`Update from ${post.author_label}`} className="border-2 border-black bg-cream">
      <header className="flex items-center gap-2.5 px-3.5 py-3">
        <span aria-hidden="true" className="w-8 h-8 rounded-full bg-black text-cream flex items-center justify-center font-fraunces text-[11px] flex-none">
          {initialsOf(post.author_label)}
        </span>
        <div className="flex flex-col min-w-0">
          <p className="font-inter text-[13px] font-bold text-black flex flex-wrap items-center gap-x-1.5">
            {post.author_label}
            <span className="font-bold text-[9px] tracking-[0.1em] uppercase border border-black px-1 leading-[14px]">From the field</span>
          </p>
          <p className="font-inter text-[11px] text-warm">{countryName} · {formatDate(post.created_at)}</p>
        </div>
      </header>

      {post.video_url ? (
        <VideoEmbed url={post.video_url} posterUrl={post.photo_url} title={post.author_label} />
      ) : post.photo_url ? (
        <div className="relative w-full aspect-[4/3]">
          <Image src={post.photo_url} alt={`Photo from ${post.author_label}`} fill unoptimized className="object-cover" />
        </div>
      ) : null}

      <div className="px-3.5 py-3 flex flex-col gap-3">
        <p className="font-inter text-[15px] leading-[1.55] text-black whitespace-pre-line">{post.body}</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={reaction.active}
            onClick={() => void react()}
            className={`min-h-[40px] px-3 border-2 font-inter text-xs font-semibold transition-colors ${
              reaction.active ? 'bg-accent border-accent text-cream' : 'border-black bg-cream text-black hover:bg-black hover:text-cream'
            }`}
          >
            {reaction.active ? 'Praying ✓' : 'Praying'} · {reaction.count}
          </button>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="min-h-[40px] px-3 border-2 border-black bg-cream font-inter text-xs font-semibold text-black hover:bg-black hover:text-cream transition-colors"
          >
            Reply · {comments.length}
          </button>
        </div>

        {open && (
          <div className="flex flex-col gap-3 border-t border-black/20 pt-3">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-2">
                <p className="font-inter text-sm text-[#3A372F] [overflow-wrap:anywhere]">
                  <span className="font-semibold text-black">{c.memberName}</span> {c.body}
                </p>
                {c.member_id === currentMemberId && (
                  <button type="button" onClick={() => void removeComment(c.id)} className="flex-none min-h-[32px] font-inter text-xs text-warm hover:text-black">
                    Delete
                  </button>
                )}
              </div>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); void addComment(); }} className="flex gap-2">
              <label className="flex-1 min-w-0">
                <span className="sr-only">Reply to {post.author_label}</span>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Reply to ${post.author_label.split(/\s+/).slice(-1)[0]}…`}
                  className="w-full min-h-[44px] border-2 border-black bg-cream font-inter text-base px-3 outline-none"
                />
              </label>
              <button type="submit" className="flex-none min-h-[44px] px-4 border-2 border-black font-inter font-semibold text-xs tracking-[0.05em] uppercase hover:bg-black hover:text-cream">
                Post
              </button>
            </form>
          </div>
        )}
        {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
      </div>
    </article>
  );
}
