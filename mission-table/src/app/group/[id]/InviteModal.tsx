'use client';

import { useState } from 'react';

type Props = {
  groupId: string;
  onClose: () => void;
};

export default function InviteModal({ groupId, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const link = `https://missiontable.org/join/${groupId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — link is still selectable in the input
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/55 z-50 flex items-start justify-center overflow-y-auto p-6 pt-16"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-cream border-2 border-black max-w-[440px] w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-black text-cream">
          <span className="font-fraunces font-bold text-lg fraunces-32">Invite to This Group</span>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none px-1">×</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="font-inter text-sm text-warm leading-[1.6]">
            Share this link with anyone you&apos;d like praying alongside your group.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 border-2 border-black bg-cream-dark font-inter text-sm px-3 py-2 outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`font-inter font-semibold text-xs tracking-[0.05em] uppercase px-4 border-2 border-black transition-colors whitespace-nowrap ${
                copied ? 'bg-accent text-cream border-accent' : 'bg-black text-cream hover:bg-cream hover:text-black'
              }`}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <div className="flex flex-col gap-2.5 pt-2 border-t border-black/20">
            {[
              'They fill out a short form with their name and contact info.',
              'Your host reviews the request and approves it from the dashboard.',
              'Once approved, they get full access to the group page and monthly meals.',
            ].map((step, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 border border-black rounded-full flex items-center justify-center font-inter text-[10px] font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="font-inter text-xs text-warm leading-[1.5]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
