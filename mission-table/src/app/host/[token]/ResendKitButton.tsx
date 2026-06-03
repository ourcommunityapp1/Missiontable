'use client';

import { useState } from 'react';
import { resendKit } from './actions';

type Props = {
  kitId: string;
  groupId: string;
  groupDisplayName: string;
};

export default function ResendKitButton({ kitId, groupId, groupDisplayName }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleClick() {
    setState('sending');
    await resendKit(kitId, groupId, groupDisplayName);
    setState('sent');
    setTimeout(() => setState('idle'), 4000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className={`font-inter font-semibold text-xs tracking-[0.05em] uppercase border-2 px-3 py-2 transition-colors whitespace-nowrap ${
        state === 'sent'
          ? 'border-black bg-black text-white'
          : 'border-black hover:bg-black hover:text-white disabled:opacity-50'
      }`}
    >
      {state === 'idle' ? 'Resend →' : state === 'sending' ? 'Sending…' : 'Sent ✓'}
    </button>
  );
}
