'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTablePost } from './loopActions';
import type { MemberLoopData } from './loopTypes';
import { fmtDate } from './dates';

/** Shrinks a photo to at most 1600px on its long side as JPEG, so uploads stay small. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
    return blob ? new File([blob], 'table.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

export default function TableTab({ token, loop }: { token: string; loop: MemberLoopData }) {
  const router = useRouter();
  const mine = loop.tablePosts.find((p) => p.memberId === loop.me.id && p.meetingDate === loop.tableDate);
  const [prayer, setPrayer] = useState(mine?.prayer ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(mine?.photoUrl ?? null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const posts = loop.tablePosts;
  const byDate = useMemo(() => {
    const map = new Map<string, typeof posts>();
    for (const p of posts) map.set(p.meetingDate, [...(map.get(p.meetingDate) ?? []), p]);
    return [...map.entries()];
  }, [posts]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const small = await shrink(f);
    setPhoto(small);
    setPreview(URL.createObjectURL(small));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!photo && !prayer.trim() && !mine) { setError('Add a photo or a line of prayer.'); return; }
    setStatus('saving');
    const fd = new FormData();
    if (photo) fd.append('photo', photo);
    fd.append('prayer', prayer);
    const res = await saveTablePost(token, loop.groupId, fd);
    if (!res.success) { setStatus('idle'); setError(res.error); return; }
    setStatus('saved');
    setPhoto(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      {loop.tableDate ? (
        <form onSubmit={submit} aria-labelledby="share-title" className="border-2 border-black bg-cream-dark p-5 flex flex-col gap-4 max-w-[560px]">
          <h2 id="share-title" className="font-fraunces font-semibold text-[22px] tracking-[-0.02em] text-black">
            {mine ? 'Your table' : 'Share your table'} from {fmtDate(loop.tableDate, { month: 'short', day: 'numeric' })}
          </h2>
          <input ref={fileInput} id="table-photo" type="file" accept="image/*" onChange={onPick} className="sr-only" />
          <label htmlFor="table-photo" className="cursor-pointer">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Your table photo" className="w-full max-h-[320px] object-cover border-2 border-black" />
            ) : (
              <span className="min-h-[120px] border-2 border-dashed border-warm bg-cream flex flex-col items-center justify-center gap-1.5 font-inter text-sm text-warm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" /><circle cx="12" cy="12" r="3.5" /><path d="M8 5l1.5-2h5L16 5" /></svg>
                Add a photo of your table
              </span>
            )}
          </label>
          {preview && (
            <button type="button" onClick={() => fileInput.current?.click()} className="self-start font-inter text-sm font-semibold underline min-h-[44px]">Choose a different photo</button>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="font-inter font-bold text-xs tracking-[0.08em] uppercase text-black">One line of what you prayed</span>
            <input
              type="text"
              value={prayer}
              maxLength={280}
              onChange={(e) => setPrayer(e.target.value)}
              placeholder="We prayed for…"
              className="min-h-[46px] border-2 border-black bg-cream px-3 font-inter text-[15px] outline-none"
            />
          </label>
          {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
          <button type="submit" disabled={status === 'saving'} className="min-h-[48px] bg-black text-cream font-inter font-bold text-[13px] tracking-[0.06em] uppercase disabled:opacity-60">
            {status === 'saving' ? 'Sharing…' : mine ? 'Update' : 'Share with the group'}
          </button>
          {status === 'saved' && <p role="status" className="font-inter text-sm text-black">Shared. Thank you!</p>}
        </form>
      ) : (
        <p className="font-inter text-base text-warm">After your first gathering, members can share a photo of their table here.</p>
      )}

      {byDate.length === 0 ? (
        <p className="font-inter text-base text-warm">No tables shared yet. Be the first!</p>
      ) : (
        byDate.map(([date, posts]) => (
          <section key={date} aria-label={`Tables from ${fmtDate(date, { month: 'long', day: 'numeric' })}`} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between border-t-2 border-black pt-3">
              <h2 className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-black">The table · {fmtDate(date, { month: 'short', day: 'numeric' })}</h2>
              <span className="font-inter text-xs text-warm">{posts.length} {posts.length === 1 ? 'table' : 'tables'}</span>
            </div>
            {posts.some((p) => p.photoUrl) && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5">
                {posts.filter((p) => p.photoUrl).map((p) => (
                  <figure key={p.id} className="relative aspect-square bg-cream-dark m-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photoUrl!} alt={`${p.memberName}'s table`} loading="lazy" className="w-full h-full object-cover" />
                    <figcaption className="absolute left-1 bottom-1 bg-cream/90 px-1.5 py-0.5 font-inter text-[10px] font-semibold text-black">{p.memberName.split(/\s+/)[0]}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            {posts.filter((p) => p.prayer).map((p) => (
              <blockquote key={p.id} className="border-t border-black/30 pt-2.5 m-0">
                <p className="font-fraunces text-[17px] leading-snug text-black">“{p.prayer}”</p>
                <p className="font-inter text-xs text-warm mt-1">{p.memberName.split(/\s+/)[0]}{p.place ? ` · ${p.place}` : ''}</p>
              </blockquote>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
