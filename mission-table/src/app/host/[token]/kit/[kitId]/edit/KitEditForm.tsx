'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { KitRow } from '@/lib/database.types';
import { updateKit } from './actions';

type Props = {
  token: string;
  kit: KitRow;
  meetingDates: string[];
};

export default function KitEditForm({ token, kit, meetingDates }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Include the kit's current date in the list if it's not already there
  const allDates = meetingDates.includes(kit.meeting_date)
    ? meetingDates
    : [kit.meeting_date, ...meetingDates];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateKit(kit.id, formData);
    setSubmitting(false);
    if (result.success) {
      router.push(`/host/${token}`);
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

      {/* Meeting date */}
      <div>
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">
          Meeting Date *
        </label>
        <select
          name="meeting_date"
          required
          defaultValue={kit.meeting_date}
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-3 outline-none"
        >
          {allDates.map((d) => (
            <option key={d} value={d}>
              {new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </option>
          ))}
        </select>
      </div>

      {/* Recipe */}
      <div className="border-t-2 border-black pt-6">
        <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-4">Recipe</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Recipe Name</label>
            <input
              name="recipe_name"
              type="text"
              defaultValue={kit.recipe_name ?? ''}
              placeholder="e.g. Chicken Mole"
              className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none"
            />
          </div>
          <div>
            <label className="block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Recipe URL</label>
            <input
              name="recipe_url"
              type="url"
              defaultValue={kit.recipe_url ?? ''}
              placeholder="https://"
              className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none"
            />
          </div>
          <div>
            <label className="block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Side Dish</label>
            <input
              name="side_dish"
              type="text"
              defaultValue={kit.side_dish ?? ''}
              placeholder="e.g. Mexican Street Corn"
              className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Scripture */}
      <div className="border-t-2 border-black pt-6">
        <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-4">Scripture</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Passage Text</label>
            <textarea
              name="scripture_text"
              rows={5}
              defaultValue={kit.scripture_text ?? ''}
              placeholder="Paste the full scripture text here..."
              className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none resize-y"
            />
          </div>
          <div>
            <label className="block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">Reference</label>
            <input
              name="scripture_reference"
              type="text"
              defaultValue={kit.scripture_reference ?? ''}
              placeholder="e.g. Romans 10:13-17 ESV"
              className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Commentary */}
      <div className="border-t-2 border-black pt-6">
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">
          Commentary / Notes
          <span className="font-normal text-warm ml-2">(optional)</span>
        </label>
        <textarea
          name="commentary"
          rows={5}
          defaultValue={kit.commentary ?? ''}
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none resize-y"
        />
      </div>

      {/* Prayer requests */}
      <div className="border-t-2 border-black pt-6">
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">Prayer Requests</label>
        <textarea
          name="prayer_requests"
          rows={5}
          defaultValue={kit.prayer_requests ?? ''}
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none resize-y"
        />
      </div>

      {/* Gathering prompt */}
      <div className="border-t-2 border-black pt-6">
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">Gathering Prompt</label>
        <textarea
          name="gathering_prompt"
          rows={3}
          defaultValue={kit.gathering_prompt ?? ''}
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none resize-y"
        />
      </div>

      {error && (
        <p className="font-inter text-sm border-2 border-black px-4 py-3 bg-white">{error}</p>
      )}

      <div className="border-t-2 border-black pt-6 flex gap-4 flex-wrap">
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase px-8 py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save Changes →'}
        </button>
        <Link
          href={`/host/${token}`}
          className="font-inter font-semibold text-sm tracking-[0.05em] uppercase px-8 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
        >
          Cancel
        </Link>
      </div>

    </form>
  );
}
