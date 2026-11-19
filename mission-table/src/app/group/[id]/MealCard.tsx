'use client';

import Image from 'next/image';
import type { KitRow } from '@/lib/database.types';
import { fmtDate } from './dates';

const label = 'font-inter font-bold text-[10px] tracking-[0.12em] uppercase text-black mb-1';

/** A month's meal: recipe, scripture, commentary, prayer requests and the gathering prompt. */
export default function MealCard({ kit, heading }: { kit: KitRow; heading: string }) {
  const prayers = (kit.prayer_requests ?? '').split('\n').map((l) => l.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);
  return (
    <section aria-label={heading} className="border-2 border-black bg-cream flex flex-col">
      <div className="px-4 py-3.5 bg-cream-dark border-b border-black flex flex-col gap-1">
        <p className="font-inter font-bold text-[10px] tracking-[0.12em] uppercase text-warm">{heading} · {fmtDate(kit.created_at, { month: 'short', day: 'numeric' })}</p>
        <h3 className="font-fraunces font-bold text-[26px] leading-[1.05] tracking-[-0.01em] text-black">{kit.recipe_name ?? 'This month’s meal'}</h3>
        {kit.side_dish && <p className="font-inter text-[13px] text-warm">With {kit.side_dish}</p>}
      </div>
      {kit.photo_url && (
        <div className="relative w-full aspect-[16/10] border-b border-black">
          <Image src={kit.photo_url} alt={kit.recipe_name ?? 'The meal'} fill unoptimized className="object-cover" />
        </div>
      )}
      <div className="px-4 py-4 flex flex-col gap-4">
        {kit.scripture_text && (
          <div>
            <p className={label}>Read together</p>
            <p className="font-fraunces text-[16px] leading-[1.55] text-black whitespace-pre-line">“{kit.scripture_text.trim()}”</p>
            {kit.scripture_reference && <p className="font-inter text-xs text-warm mt-1">{kit.scripture_reference}</p>}
          </div>
        )}
        {kit.commentary && (
          <div>
            <p className={label}>From your host</p>
            <p className="font-inter text-[14px] leading-[1.6] text-[#3A372F] whitespace-pre-line">{kit.commentary}</p>
          </div>
        )}
        {prayers.length > 0 && (
          <div>
            <p className={label}>Pray for</p>
            <ul className="m-0 pl-[18px] list-disc font-inter text-[14px] leading-[1.55] text-[#3A372F]">
              {prayers.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
        {kit.gathering_prompt && (
          <div>
            <p className={label}>At the table</p>
            <p className="font-inter text-[14px] leading-[1.6] text-[#3A372F] italic">{kit.gathering_prompt}</p>
          </div>
        )}
        {kit.recipe_url && (
          <a href={kit.recipe_url} target="_blank" rel="noopener noreferrer" className="self-start min-h-[44px] inline-flex items-center px-4 bg-black text-cream font-inter text-xs font-bold tracking-[0.06em] uppercase">
            Open the recipe ↗
          </a>
        )}
      </div>
    </section>
  );
}
