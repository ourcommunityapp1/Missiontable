'use client';

import { useState } from 'react';
import type { FieldPostWithEngagement } from '@/lib/queries';
import MealsTab, { type KitWithMeta } from './MealsTab';
import FieldTab from './FieldTab';
import MembersTab from './MembersTab';

type Tab = 'meals' | 'field' | 'members';

type Member = { id: string; name: string; city: string | null; state: string | null };

type Props = {
  token: string;
  currentMemberId: string;
  kits: KitWithMeta[];
  showTbdPlaceholder: boolean;
  nextExpectedDateLabel: string | null;
  meetingTimeLabel: string;
  countryName: string;
  fieldPosts: FieldPostWithEngagement[];
  members: Member[];
  chatLink: string | null;
  infoSlot?: React.ReactNode;
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'meals', label: 'Meals' },
  { key: 'field', label: 'From the Field' },
  { key: 'members', label: 'Members' },
];

export default function GroupTabs(props: Props) {
  const [active, setActive] = useState<Tab>('meals');

  return (
    <div className="max-w-[820px]">
      <div className="flex gap-0 border-b-2 border-black mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`flex-none font-inter font-semibold text-xs tracking-[0.05em] uppercase pt-3 pb-2.5 mr-6 border-b-[3px] -mb-0.5 transition-colors whitespace-nowrap ${
              active === tab.key ? 'border-accent text-black' : 'border-transparent text-warm hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {props.infoSlot}

      {active === 'meals' && (
        <MealsTab
          kits={props.kits}
          showTbdPlaceholder={props.showTbdPlaceholder}
          nextExpectedDateLabel={props.nextExpectedDateLabel}
          token={props.token}
          currentMemberId={props.currentMemberId}
          totalMembers={props.members.length}
          meetingTimeLabel={props.meetingTimeLabel}
        />
      )}
      {active === 'field' && (
        <FieldTab posts={props.fieldPosts} token={props.token} currentMemberId={props.currentMemberId} countryName={props.countryName} />
      )}
      {active === 'members' && (
        <MembersTab members={props.members} chatLink={props.chatLink} />
      )}
    </div>
  );
}
