'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTablePost } from './loopActions';
import type { MemberLoopData } from './loopTypes';
import type { TablePostView } from '@/lib/memberApp';
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

export function ShareTable({ token, loop }: { token: string; loop: MemberLoopData }) {
  const router = useRouter();
  const date = loop.tableDate;
  const mine = loop.tablePosts.find((p) => p.memberId === loop.me.id && p.meetingDate === date);
  const [prayer, setPrayer] = useState(mine?.prayer ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(mine?.photoUrl ?? null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

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

  if (!date) return null;
  return (
    <form onSubmit={submit} aria-labelledby="share-title" className="border-2 border-black bg-cream p-4 flex flex-col gap-3.5">
      <h2 id="share-title" className="font-fraunces font-bold text-[24px] leading-[1.1] tracking-[-0.02em] text-black">
        {mine ? 'Your table' : 'Share your table'} from {fmtDate(date, { month: 'short', day: 'numeric' })}
      </h2>
      <p className="font-inter text-[13px] leading-normal text-[#3A372F]">A photo and one line of prayer. Your host sees every table.</p>
      <input ref={fileInput} id="table-photo" type="file" accept="image/*" onChange={onPick} className="sr-only" />
      <label htmlFor="table-photo" className="cursor-pointer">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your table photo" className="w-full max-h-[320px] object-cover border-2 border-black" />
        ) : (
          <span className="min-h-[120px] border-2 border-dashed border-black bg-cream-dark flex flex-col items-center justify-center gap-1.5 font-inter text-[13px] font-semibold text-black">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="1" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2h5L16 6" /></svg>
            Add a photo
          </span>
        )}
      </label>
      {preview && (
        <button type="button" onClick={() => fileInput.current?.click()} className="self-start font-inter text-sm font-semibold underline min-h-[44px]">Choose a different photo</button>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="font-inter font-bold text-[10px] tracking-[0.12em] uppercase text-black">One line of prayer</span>
        <input
          type="text"
          value={prayer}
          maxLength={280}
          onChange={(e) => setPrayer(e.target.value)}
          placeholder="We prayed for…"
          className="min-h-[46px] border-2 border-black bg-cream px-3 font-inter text-base outline-none"
        />
      </label>
      {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
      <button type="submit" disabled={status === 'saving'} className="min-h-[48px] bg-black text-cream font-inter font-bold text-[13px] tracking-[0.06em] uppercase disabled:opacity-60">
        {status === 'saving' ? 'Sharing…' : mine ? 'Update' : 'Share with the group'}
      </button>
      {status === 'saved' && <p role="status" className="font-inter text-sm text-black">Shared. Thank you!</p>}
    </form>
  );
}

/** Everyone's table photos and prayer lines from one gathering. */
export function TablePhotos({ posts, date }: { posts: TablePostView[]; date: string }) {
  const mine = posts.filter((p) => p.meetingDate === date);
  if (mine.length === 0) return null;
  return (
    <section aria-label={`Tables from ${fmtDate(date, { month: 'long', day: 'numeric' })}`} className="flex flex-col gap-2.5">
      <h3 className="font-inter font-bold text-[11px] tracking-[0.12em] uppercase text-black">
        Tables from {fmtDate(date, { month: 'short', day: 'numeric' })} · {mine.length} shared
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {mine.map((p) => (
          <figure key={p.id} className="m-0 flex flex-col gap-1.5">
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoUrl} alt={`${p.memberName}'s table`} loading="lazy" className="w-full aspect-square object-cover border-2 border-black" />
            ) : (
              <div className="w-full aspect-square border-2 border-black bg-cream-dark flex items-center justify-center p-3 font-fraunces text-[15px] leading-snug text-black text-center">“{p.prayer}”</div>
            )}
            <figcaption className="font-inter text-xs leading-snug text-[#3A372F]">
              <strong className="text-black">{p.memberName.split(/\s+/)[0]}</strong>
              {p.photoUrl && p.prayer ? ` · “${p.prayer}”` : ''}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
