'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { GroupDetail } from '@/lib/queries';
import { joinGroup } from './actions';

export default function JoinGroupForm({ group }: { group: GroupDetail }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await joinGroup(group.id, formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">
        <div className="max-w-[560px]">
          <div className="border-2 border-black p-8 md:p-12">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-4">
              Request Received
            </p>
            <h2 className="font-fraunces font-bold text-[40px] md:text-[48px] uppercase leading-none tracking-[-0.03em] fraunces-64 text-black mb-6">
              You&apos;re In
            </h2>
            <p className="font-inter text-base text-warm mb-4">
              Your request to join this group has been received. Your host will reach out within 3 days to welcome you.
            </p>
            <p className="font-inter text-sm text-warm mb-8">
              Questions? Email{' '}
              <a
                href="mailto:projectmissiontable@gmail.com"
                className="font-semibold text-black underline"
              >
                projectmissiontable@gmail.com
              </a>
            </p>
            <Link
              href={`/country/${group.countrySlug}`}
              className="block w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase text-center py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors"
            >
              Back to {group.countryName} →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">

      {/* Back nav */}
      <div className="mb-8">
        <Link
          href={`/group/${group.id}`}
          className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
        >
          <span aria-hidden="true">←</span>
          Group Details
        </Link>
      </div>

      <div className="max-w-[640px]">

        {/* Group summary */}
        <div className="border-2 border-black p-5 mb-8">
          <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-1">
            {group.groupType === 'virtual' ? 'Virtual Group' : 'In-Person Group'} · {group.countryName}
          </p>
          <p className="font-fraunces font-bold text-[28px] uppercase leading-none fraunces-32 text-black mb-1">
            {group.name ?? group.hostedBy}
          </p>
          {group.name && (
            <p className="font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-warm mb-2">
              Hosted By {group.hostedBy}
            </p>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <p className="font-inter text-sm text-warm">{group.rhythm}</p>
            <p className="font-inter text-sm text-warm">{group.time}</p>
          </div>
        </div>

        {/* Form header */}
        <div className="border-t-2 border-black pt-4 mb-8">
          <h1 className="font-fraunces font-bold text-[40px] md:text-[48px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-black">
            Request to Join
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
              Name <span className="text-accent">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="border-2 border-black bg-cream px-4 py-3 font-inter text-base text-black placeholder:text-muted focus:outline-none focus:border-black"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
              Email <span className="text-accent">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="border-2 border-black bg-cream px-4 py-3 font-inter text-base text-black placeholder:text-muted focus:outline-none focus:border-black"
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
              Phone <span className="text-accent">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="border-2 border-black bg-cream px-4 py-3 font-inter text-base text-black placeholder:text-muted focus:outline-none focus:border-black"
              placeholder="(555) 000-0000"
            />
          </div>

          {/* Church */}
          <div className="flex flex-col gap-2">
            <label htmlFor="church" className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
              Church
            </label>
            <input
              id="church"
              name="church"
              type="text"
              autoComplete="organization"
              className="border-2 border-black bg-cream px-4 py-3 font-inter text-base text-black placeholder:text-muted focus:outline-none focus:border-black"
              placeholder="Your home church (optional)"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="city" className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                className="border-2 border-black bg-cream px-4 py-3 font-inter text-base text-black placeholder:text-muted focus:outline-none focus:border-black"
                placeholder="City"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="state" className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                autoComplete="address-level1"
                className="border-2 border-black bg-cream px-4 py-3 font-inter text-base text-black placeholder:text-muted focus:outline-none focus:border-black"
                placeholder="State"
              />
            </div>
          </div>
          <p className="font-inter text-xs text-muted -mt-4">Where you&apos;re located</p>

          {/* Error */}
          {error && (
            <p className="font-inter text-sm text-accent border-2 border-accent px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Submitting…' : 'Request to Join →'}
          </button>

        </form>
      </div>
    </div>
  );
}
