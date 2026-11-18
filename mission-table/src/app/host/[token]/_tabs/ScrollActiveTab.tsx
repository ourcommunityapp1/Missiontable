'use client';

import { useEffect } from 'react';

/** On phones the tab strip scrolls sideways; keep the current tab in view. */
export default function ScrollActiveTab({ navId }: { navId: string }) {
  useEffect(() => {
    const nav = document.getElementById(navId);
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) return;
    const left = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left) });
  }, [navId]);
  return null;
}
