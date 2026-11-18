'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { initialsOf, placeLabel } from '@/lib/people';
import { addInviteGuests } from '../../loopActions';

type Person = { id: string; name: string; city: string | null; state: string | null; church: string | null };

export default function AddGuests({ token, groupId, inviteId, people }: { token: string; groupId: string; inviteId: string; people: Person[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (people.length === 0) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start min-h-[48px] px-5 border-2 border-black font-inter font-semibold text-[13px] tracking-[0.06em] uppercase">
        Invite more people
      </button>
    );
  }

  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <section aria-labelledby="add-title" className="flex flex-col gap-3">
      <h2 id="add-title" className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-black">Invite more people</h2>
      <ul className="border-t-2 border-black">
        {people.map((m) => (
          <li key={m.id}>
            <label className="flex items-center gap-3 border-b border-[#C9C3B5] py-2.5 cursor-pointer">
              <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-full border-2 border-black bg-cream-dark inline-flex items-center justify-center text-[11px] font-bold">{initialsOf(m.name)}</span>
              <span className="flex flex-col min-w-0 flex-1">
                <span className="font-inter text-sm font-semibold truncate">{m.name}</span>
                <span className="font-inter text-xs text-warm truncate">{[placeLabel(m.city, m.state), m.church].filter(Boolean).join(' · ') || 'City and church not shared'}</span>
              </span>
              <input type="checkbox" checked={picked.has(m.id)} onChange={() => toggle(m.id)} aria-label={`Invite ${m.name}`} className="w-[22px] h-[22px] accent-black" />
            </label>
          </li>
        ))}
      </ul>
      {msg && <p role="status" className="font-inter text-sm">{msg}</p>}
      <button
        type="button"
        disabled={busy || picked.size === 0}
        onClick={async () => {
          setBusy(true); setMsg('');
          const r = await addInviteGuests(token, groupId, inviteId, [...picked]);
          setBusy(false);
          if (!r.success) return setMsg(r.error);
          setPicked(new Set()); setOpen(false); router.refresh();
        }}
        className="min-h-[52px] bg-black text-cream font-inter font-bold text-sm tracking-[0.06em] uppercase disabled:opacity-50"
      >
        {busy ? 'Sending…' : picked.size ? `Invite ${picked.size} more` : 'Choose people'}
      </button>
    </section>
  );
}
