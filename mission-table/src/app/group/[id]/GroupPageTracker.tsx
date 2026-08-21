'use client';

import { useEffect } from 'react';
import { track, identify } from '@/lib/mixpanel';

type Props = {
  groupId: string;
  countrySlug: string;
  countryName: string;
  groupType: string;
  groupName: string | null;
  memberCount: number;
  isMember: boolean;
  memberToken?: string;
};

export default function GroupPageTracker({ groupId, countrySlug, countryName, groupType, groupName, memberCount, isMember, memberToken }: Props) {
  useEffect(() => {
    // Ties this session to the same distinct_id used for server-side kit_email_sent /
    // member_approved events, so kit-send-to-page-view funnels can join on identity.
    if (isMember && memberToken) {
      identify(memberToken);
    }
    track('group_detail_viewed', {
      group_id: groupId,
      country_slug: countrySlug,
      country_name: countryName,
      group_type: groupType,
      ...(groupName ? { group_name: groupName } : {}),
      member_count: memberCount,
      is_member_view: isMember,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
