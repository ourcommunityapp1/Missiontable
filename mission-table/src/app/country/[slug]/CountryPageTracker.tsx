'use client';

import { useEffect } from 'react';
import { track } from '@/lib/mixpanel';

type Props = {
  countrySlug: string;
  countryName: string;
  region: string;
  groupCount: number;
};

export default function CountryPageTracker({ countrySlug, countryName, region, groupCount }: Props) {
  useEffect(() => {
    track('country_page_viewed', {
      country_slug: countrySlug,
      country_name: countryName,
      region,
      group_count: groupCount,
      has_groups: groupCount > 0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
