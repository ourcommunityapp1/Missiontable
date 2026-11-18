'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sameArea, sameChurch, initialsOf, placeLabel } from '@/lib/people';
import { createInvite, type InviteInput } from './loopActions';
import type { MemberLoopData } from './loopTypes';
import { fmtDate } from './dates';

type Filter = 'all' | 'near' | 'church';

const ARRIVE = ['4:30 PM', '5:00 PM', '5:30 PM', '5:45 PM', '6:00 PM', '6:30 PM'];

const field = 'min-h-[46px] border-2 border-black bg-white px-3 font-inter text-[15px] outline-none w-full min-w-0';
const legend = 'font-inter font-bold text-xs tracking-[0.12em] uppercase text-black mb-2';

export default function InviteFlow({ token, loop, onClose }: { token: string; loop: MemberLoopData; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [placeType, setPlaceType] = useState<'home' | 'restaurant'>('home');
  const [placeName, setPlaceName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState(loop.me.city ?? '');
  const [state, setState] = useState(loop.me.state ?? '');
  const [zip, setZip] = useState('');
  const [arriveTime, setArriveTime] = useState('5:30 PM');
  const [food, setFood] = useState<'cook' | 'potluck' | 'order'>('cook');
  const [seats, setSeats] = useState(6);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const people = useMemo(() => {
    const list = loop.directory.filter((m) =>
      filter === 'near' ? sameArea(m, loop.me) : filter === 'church' ? sameChurch(m.church, loop.me.church) : true,
    );
    // Nearby and same-church people first, then alphabetical.
    const score = (m: (typeof list)[number]) => (sameArea(m, loop.me) ? 2 : 0) + (sameChurch(m.church, loop.me.church) ? 1 : 0);
    return [...list].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
  }, [filter, loop.directory, loop.me]);

  const nearCount = loop.directory.filter((m) => sameArea(m, loop.me)).length;
  const churchCount = loop.directory.filter((m) => sameChurch(m.church, loop.me.church)).length;

  function next(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (placeType === 'restaurant' && !placeName.trim()) return setError('Add the restaurant name.');
    if (!addressLine.trim() || !city.trim()) return setError('Add the street address and city.');
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  async function send() {
    setError('');
    if (picked.size === 0) return setError('Choose at least one person.');
    setSending(true);
    const input: InviteInput = {
      placeType, placeName, addressLine, city, state, zip, arriveTime,
      food: placeType === 'restaurant' ? 'order' : food, seats, note, guestIds: [...picked],
    };
    const res = await createInvite(token, loop.groupId, input);
    setSending(false);
    if (!res.success) return setError(res.error);
    setSentCount(picked.size);
    setStep(3);
    router.refresh();
  }

  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const dateLabel = loop.nextDate ? fmtDate(loop.nextDate, { weekday: 'short', month: 'short', day: 'numeric' }) : '';

  if (step === 3) {
    return (
      <section className="border-2 border-black p-6 flex flex-col gap-3 max-w-[560px]" role="status">
        <h2 className="font-fraunces font-bold text-[26px] tracking-[-0.02em] text-black">Invitations sent</h2>
        <p className="font-inter text-[15px] text-[#3A372F]">We emailed {sentCount} {sentCount === 1 ? 'person' : 'people'}. You&apos;ll get an email as each one answers, and you can see who&apos;s coming below.</p>
        <button type="button" onClick={onClose} className="self-start min-h-[48px] bg-black text-cream font-inter font-bold text-[13px] tracking-[0.06em] uppercase px-5">Done</button>
      </section>
    );
  }

  return (
    <section aria-labelledby="flow-title" className="max-w-[560px] flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="min-h-[44px] -ml-1 font-inter text-sm font-semibold text-black inline-flex items-center gap-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <span className="font-inter font-bold text-xs tracking-[0.12em] uppercase text-warm">Step {step} of 2</span>
        </div>
        <h2 id="flow-title" className="font-fraunces font-bold text-[26px] leading-tight tracking-[-0.02em] text-black">
          {step === 1 ? 'Invite people to eat together' : 'Who do you want to invite?'}
        </h2>
        <div aria-hidden="true" className="grid grid-cols-2 gap-1"><span className="h-1 bg-black" /><span className={`h-1 ${step === 2 ? 'bg-black' : 'bg-[#C9C3B5]'}`} /></div>
      </div>

      {step === 1 ? (
        <form onSubmit={next} className="flex flex-col gap-6">
          <fieldset className="flex flex-col">
            <legend className={legend}>Where</legend>
            <div className="grid grid-cols-2 border-2 border-black">
              {(['home', 'restaurant'] as const).map((t) => (
                <label key={t} className={`min-h-[48px] flex items-center justify-center gap-2 font-inter text-sm cursor-pointer ${placeType === t ? 'bg-black text-cream font-bold' : 'font-semibold'}`}>
                  <input type="radio" name="where" value={t} checked={placeType === t} onChange={() => setPlaceType(t)} className="accent-current" />
                  {t === 'home' ? 'My home' : 'A restaurant'}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className={legend}>Address</legend>
            {placeType === 'restaurant' && (
              <label className="flex flex-col gap-1 font-inter text-[13px] font-semibold">Restaurant name
                <input className={field} value={placeName} onChange={(e) => setPlaceName(e.target.value)} maxLength={120} required />
              </label>
            )}
            <label className="flex flex-col gap-1 font-inter text-[13px] font-semibold">Street address
              <input className={field} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} maxLength={160} autoComplete="street-address" required />
            </label>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-2">
              <label className="flex flex-col gap-1 font-inter text-[13px] font-semibold">City
                <input className={field} value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} autoComplete="address-level2" required />
              </label>
              <label className="flex flex-col gap-1 font-inter text-[13px] font-semibold">State
                <input className={field} value={state} onChange={(e) => setState(e.target.value)} maxLength={40} autoComplete="address-level1" />
              </label>
              <label className="flex flex-col gap-1 font-inter text-[13px] font-semibold">ZIP
                <input className={field} value={zip} onChange={(e) => setZip(e.target.value)} maxLength={12} inputMode="numeric" autoComplete="postal-code" />
              </label>
            </div>
            <p className="font-inter text-xs text-warm">Only the people you invite see the address.</p>
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className={legend}>When</legend>
            <p className="border-2 border-[#C9C3B5] bg-cream-dark p-3 font-inter text-sm"><strong>{dateLabel}</strong> · the group prays at {loop.timeLabel}</p>
            <label className="flex items-center justify-between gap-3 font-inter text-sm font-semibold">Guests arrive at
              <select value={arriveTime} onChange={(e) => setArriveTime(e.target.value)} className="min-h-[46px] border-2 border-black bg-white px-2 font-inter text-[15px]">
                {ARRIVE.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
          </fieldset>

          {placeType === 'home' && (
            <fieldset className="flex flex-col gap-2">
              <legend className={legend}>Food</legend>
              {([['cook', "I'll cook this month's meal"], ['potluck', 'Potluck: guests bring a side']] as const).map(([v, label]) => (
                <label key={v} className={`min-h-[46px] flex items-center gap-2.5 border-2 px-3 font-inter text-sm cursor-pointer ${food === v ? 'border-black' : 'border-[#C9C3B5]'}`}>
                  <input type="radio" name="food" value={v} checked={food === v} onChange={() => setFood(v)} className="w-[18px] h-[18px] accent-black" />
                  {label}
                </label>
              ))}
            </fieldset>
          )}

          <div className="flex items-center justify-between gap-3 font-inter text-sm font-semibold">
            <span id="seats-label">How many guests can you host?</span>
            <div role="group" aria-labelledby="seats-label" className="inline-flex border-2 border-black">
              <button type="button" aria-label="Fewer guests" onClick={() => setSeats((n) => Math.max(1, n - 1))} className="w-11 h-11 text-xl">−</button>
              <output aria-live="polite" className="w-10 inline-flex items-center justify-center font-bold border-x-2 border-black">{seats}</output>
              <button type="button" aria-label="More guests" onClick={() => setSeats((n) => Math.min(50, n + 1))} className="w-11 h-11 text-xl">+</button>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={legend.replace(' mb-2', '')}>Note to guests (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={600} placeholder="Parking, kids welcome, allergies, gate code…" className="border-2 border-black bg-white px-3 py-2.5 font-inter text-[15px] outline-none" />
          </label>

          {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
          <button type="submit" className="min-h-[52px] bg-black text-cream font-inter font-bold text-sm tracking-[0.06em] uppercase">Next: choose who →</button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-cream-dark border border-[#C9C3B5] px-3.5 py-3 flex items-center justify-between gap-3">
            <p className="font-inter text-[13px] leading-snug">
              <strong>{placeType === 'restaurant' ? placeName : 'Your home'}{city ? `, ${city}` : ''}</strong><br />
              {dateLabel} · guests arrive {arriveTime} · up to {seats}
            </p>
            <button type="button" onClick={() => setStep(1)} className="font-inter text-[13px] font-semibold underline min-h-[44px]">Edit</button>
          </div>

          <div role="group" aria-label="Show" className="flex gap-1.5 flex-wrap">
            {([['all', 'Everyone'], ['near', `Near me${nearCount ? ` (${nearCount})` : ''}`], ['church', `My church${churchCount ? ` (${churchCount})` : ''}`]] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={filter === v}
                onClick={() => setFilter(v)}
                className={`min-h-[40px] px-3.5 font-inter text-[13px] ${filter === v ? 'bg-black text-cream font-semibold' : 'border-2 border-black'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <fieldset>
            <legend className={legend}>{loop.directory.length} members · {picked.size} selected</legend>
            {people.length === 0 ? (
              <p className="font-inter text-sm text-warm border-t-2 border-black pt-3">
                {filter === 'near' ? 'No one else in the group has shared a nearby city.' : 'No one else in the group listed your church.'}
              </p>
            ) : (
              <ul className="border-t-2 border-black">
                {people.map((m) => (
                  <li key={m.id}>
                    <label className="flex items-center gap-3 border-b border-[#C9C3B5] py-2.5 px-0.5 cursor-pointer">
                      <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full border-2 border-black bg-cream-dark inline-flex items-center justify-center font-inter text-[11px] font-bold">{initialsOf(m.name)}</span>
                      <span className="flex flex-col min-w-0 flex-1">
                        <span className="font-inter text-sm font-semibold text-black truncate">{m.name}</span>
                        <span className="font-inter text-xs text-warm truncate">{placeLabel(m.city, m.state) || 'City not shared'}</span>
                        <span className="font-inter text-xs text-warm truncate">{m.church ?? 'Church not shared'}</span>
                      </span>
                      <input type="checkbox" checked={picked.has(m.id)} onChange={() => toggle(m.id)} aria-label={`Invite ${m.name}`} className="w-[22px] h-[22px] accent-black shrink-0" />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {error && <p role="alert" className="font-inter text-sm text-[#8A3A12]">{error}</p>}
          <div className="sticky bottom-0 bg-cream border-t-2 border-black pt-3 pb-4 flex flex-col gap-1.5">
            <button type="button" onClick={send} disabled={sending || picked.size === 0} className="min-h-[52px] bg-black text-cream font-inter font-bold text-sm tracking-[0.06em] uppercase disabled:opacity-50">
              {sending ? 'Sending…' : picked.size ? `Send ${picked.size} invitation${picked.size === 1 ? '' : 's'}` : 'Choose people to invite'}
            </button>
            <span className="font-inter text-xs text-center text-warm">They&apos;ll get an email with your details.</span>
          </div>
        </div>
      )}
    </section>
  );
}
