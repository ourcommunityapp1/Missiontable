'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { lookupMemberAccess } from './actions';

export default function MemberAccessForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const result = await lookupMemberAccess(groupId, email);
    if ('error' in result) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/group/${groupId}?token=${result.token}`);
    }
  }

  return (
    <div className="border-2 border-black p-5 mt-4">
      <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-1">
        Already a Member?
      </p>
      <p className="font-inter text-sm text-warm mb-4">
        Enter your email to view the full group page, including members and the monthly kit.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="border-2 border-black px-3 py-2 font-inter text-sm w-full bg-cream focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase py-3 border-2 border-black hover:bg-cream hover:text-black transition-colors disabled:opacity-50"
        >
          {loading ? 'Looking up…' : 'View Group →'}
        </button>
        {error && (
          <p className="font-inter text-sm text-red-600">{error}</p>
        )}
      </form>
    </div>
  );
}
