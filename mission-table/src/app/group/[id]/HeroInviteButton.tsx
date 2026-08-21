'use client';

import { useState } from 'react';
import InviteModal from './InviteModal';

type Props = { groupId: string };

export default function HeroInviteButton({ groupId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 bg-cream border-2 border-black text-black px-3 py-1.5 font-inter text-xs font-semibold tracking-[0.04em] uppercase hover:bg-black hover:text-cream transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19c.7-3 2.8-4.6 5.5-4.6s4.8 1.6 5.5 4.6" />
          <path d="M18 8v5M15.5 10.5h5" />
        </svg>
        Invite
      </button>
      {open && <InviteModal groupId={groupId} onClose={() => setOpen(false)} />}
    </>
  );
}
