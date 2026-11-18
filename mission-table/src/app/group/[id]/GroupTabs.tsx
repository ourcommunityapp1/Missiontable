'use client';

import { useEffect, useRef, useState } from 'react';
import type { FieldPostWithEngagement } from '@/lib/queries';
import MealsTab, { type KitWithMeta } from './MealsTab';
import FieldTab from './FieldTab';
import MembersTab from './MembersTab';
import RsvpCard from './RsvpCard';
import InstallCard from './InstallCard';
import CompanySheet from './CompanySheet';
import InvitePopup from './InvitePopup';
import TableTab from './TableTab';
import TogetherTab from './TogetherTab';
import { setRsvp, markInvitesSeen } from './loopActions';
import type { MemberLoopData } from './loopTypes';

type Tab = 'month' | 'table' | 'field' | 'together' | 'members';

type Member = { id: string; name: string; city: string | null; state: string | null; church?: string | null };

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
  loop: MemberLoopData;
  infoSlot?: React.ReactNode;
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'month', label: 'This month' },
  { key: 'table', label: 'Our table' },
  { key: 'field', label: 'From the field' },
  { key: 'together', label: 'Eat together' },
  { key: 'members', label: 'Members' },
];

function initialTab(t: string | null): Tab {
  if (t === 'meals') return 'month';
  return (TABS.find((x) => x.key === t)?.key ?? 'month') as Tab;
}

export default function GroupTabs(props: Props) {
  const { loop, token } = props;
  const [active, setActive] = useState<Tab>(() => initialTab(loop.initialTab));
  const [myRsvp, setMyRsvp] = useState(() =>
    loop.autoRsvp && loop.autoRsvp.date === loop.nextDate ? loop.autoRsvp.status : loop.myRsvp,
  );
  const [inCount, setInCount] = useState(loop.inMembers.length);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [startInvite, setStartInvite] = useState(false);
  const [toast, setToast] = useState(() =>
    loop.autoRsvp && loop.autoRsvp.date !== loop.nextDate ? 'That gathering has already happened.' : '',
  );
  const [popup, setPopup] = useState(() =>
    loop.autoRsvp ? null : loop.received.find((i) => i.myStatus === 'invited' && !i.mySeen) ?? null,
  );
  const handledLink = useRef(false);

  const pendingInvites = loop.received.filter((i) => i.myStatus === 'invited').length;

  function cleanUrl(tab?: Tab) {
    const q = new URLSearchParams({ token });
    if (tab && tab !== 'month') q.set('tab', tab);
    window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
  }

  /** Saves an answer and applies the result; `prev` is restored if saving fails. */
  async function save(status: 'in' | 'out', prev: 'in' | 'out' | null) {
    if (!loop.nextDate) return;
    const res = await setRsvp(token, loop.groupId, loop.nextDate, status);
    if (!res.success) {
      setMyRsvp(prev);
      setToast(res.error);
      return;
    }
    setInCount(res.inCount);
    if (status === 'in') setSheetOpen(true);
    else setToast('Thanks for letting us know. We’ll miss you at the table.');
  }

  function answer(status: 'in' | 'out') {
    const prev = myRsvp;
    setMyRsvp(status);
    void save(status, prev);
  }

  // One-tap answers from the "Are you in?" email arrive as ?rsvp=in|out&date=…
  // The answer is shown right away (initial state) and saved here.
  useEffect(() => {
    if (handledLink.current || !loop.autoRsvp) return;
    handledLink.current = true;
    // Defer: Next's router syncs the URL in its own (parent) effect, which runs after ours.
    setTimeout(() => cleanUrl(active), 0);
    if (loop.autoRsvp.date !== loop.nextDate) return; // toast already set in initial state
    // save() only updates state after the server call resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void save(loop.autoRsvp.status, loop.myRsvp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function selectTab(tab: Tab) {
    setActive(tab);
    cleanUrl(tab);
  }

  return (
    <div className="max-w-[820px]">
      <div role="tablist" aria-label="Group sections" className="flex gap-0 border-b-2 border-black mb-6 overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => selectTab(tab.key)}
            className={`flex-none inline-flex items-center gap-1.5 font-inter font-semibold text-xs tracking-[0.05em] uppercase pt-3 pb-2.5 mr-6 border-b-[3px] -mb-0.5 transition-colors whitespace-nowrap min-h-[44px] ${
              active === tab.key ? 'border-accent text-black' : 'border-transparent text-warm hover:text-black'
            }`}
          >
            {tab.label}
            {tab.key === 'together' && pendingInvites > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-black text-cream text-[10px] font-bold inline-flex items-center justify-center px-1" aria-label={`${pendingInvites} invitation${pendingInvites === 1 ? '' : 's'}`}>
                {pendingInvites}
              </span>
            )}
          </button>
        ))}
      </div>

      {active === 'month' && (
        <>
          {loop.nextDate && (
            <RsvpCard
              nextDate={loop.nextDate}
              timeLabel={loop.timeLabel}
              myRsvp={myRsvp}
              inCount={inCount}
              faces={loop.inMembers.map((m) => m.name)}
              onAnswer={answer}
              onInvite={() => { setStartInvite(true); selectTab('together'); }}
            />
          )}
          {props.infoSlot}
          <MealsTab
            kits={props.kits}
            showTbdPlaceholder={props.showTbdPlaceholder}
            nextExpectedDateLabel={props.nextExpectedDateLabel}
            token={props.token}
            currentMemberId={props.currentMemberId}
            totalMembers={props.members.length}
            meetingTimeLabel={props.meetingTimeLabel}
          />
          <InstallCard groupName={loop.groupName} />
        </>
      )}
      {active === 'table' && <TableTab token={token} loop={loop} />}
      {active === 'field' && (
        <FieldTab posts={props.fieldPosts} token={props.token} currentMemberId={props.currentMemberId} countryName={props.countryName} />
      )}
      {active === 'together' && (
        <TogetherTab token={token} loop={loop} startInvite={startInvite} onFlowClosed={() => setStartInvite(false)} />
      )}
      {active === 'members' && <MembersTab members={props.members} chatLink={props.chatLink} />}

      {sheetOpen && loop.nextDate && (
        <CompanySheet
          nextDate={loop.nextDate}
          me={loop.me}
          directory={loop.directory}
          onInvite={() => { setSheetOpen(false); setStartInvite(true); selectTab('together'); }}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {!sheetOpen && popup && (
        <InvitePopup
          invite={popup}
          token={token}
          onLater={() => {
            void markInvitesSeen(token, loop.groupId, [popup.id]);
            setPopup(null);
          }}
        />
      )}

      {toast && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 bg-black text-cream font-inter text-sm px-5 py-3 max-w-[90vw] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
