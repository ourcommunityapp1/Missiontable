'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initMixpanel, track } from '@/lib/mixpanel';

function getPageProps(pathname: string): Record<string, string> {
  if (pathname === '/') return { page_type: 'home' };
  if (pathname === '/browse') return { page_type: 'browse' };
  if (pathname === '/about') return { page_type: 'about' };
  if (pathname === '/start') return { page_type: 'start_group' };
  if (pathname === '/host/login') return { page_type: 'host_login' };

  let m: RegExpMatchArray | null;

  m = pathname.match(/^\/country\/([^/]+)$/);
  if (m) return { page_type: 'country', country_slug: m[1] };

  m = pathname.match(/^\/group\/([^/]+)$/);
  if (m) return { page_type: 'group_detail', group_id: m[1] };

  m = pathname.match(/^\/join\/([^/]+)$/);
  if (m) return { page_type: 'join_group', group_id: m[1] };

  if (/^\/host\/[^/]+\/kit\/new$/.test(pathname)) return { page_type: 'host_kit_new' };
  if (/^\/host\/[^/]+\/kit\/[^/]+\/edit$/.test(pathname)) return { page_type: 'host_kit_edit' };
  if (/^\/host\/[^/]+\/group\/[^/]+\/edit$/.test(pathname)) return { page_type: 'host_group_edit' };
  if (/^\/host\/[^/]+\/field-post\/new$/.test(pathname)) return { page_type: 'host_field_post_new' };
  if (/^\/host\/[^/]+$/.test(pathname)) return { page_type: 'host_dashboard' };

  return { page_type: 'other' };
}

export default function MixpanelProvider() {
  const pathname = usePathname();

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    track('Page View', { path: pathname, ...getPageProps(pathname) });
  }, [pathname]);

  return null;
}
