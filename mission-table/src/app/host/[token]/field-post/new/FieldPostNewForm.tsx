'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createFieldPost } from './actions';

type Props = {
  token: string;
  groupId: string;
};

export default function FieldPostNewForm({ token, groupId }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createFieldPost(token, groupId, formData);
    setSubmitting(false);
    if (result.success) {
      router.push(`/host/${token}`);
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

      <div>
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">
          From *
        </label>
        <input
          name="author_label"
          type="text"
          required
          placeholder="e.g. The Rahman Family"
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-3 outline-none"
        />
        <p className="font-inter text-xs text-warm mt-1">Who this update is from — your mission partner&apos;s name.</p>
      </div>

      <div className="border-t-2 border-black pt-6">
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">
          Update *
        </label>
        <textarea
          name="body"
          rows={6}
          required
          placeholder="Share what's happening in the field..."
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none resize-y"
        />
      </div>

      <div className="border-t-2 border-black pt-6">
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">
          Photo URL
          <span className="font-normal text-warm ml-2">(optional)</span>
        </label>
        <input
          name="photo_url"
          type="url"
          placeholder="https://"
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none"
        />
      </div>

      <div className="border-t-2 border-black pt-6">
        <label className="block font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-2">
          Video Link
          <span className="font-normal text-warm ml-2">(optional — YouTube, Vimeo, etc.)</span>
        </label>
        <input
          name="video_url"
          type="url"
          placeholder="https://"
          className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none"
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
          {submitting ? 'Publishing…' : 'Publish Update →'}
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
