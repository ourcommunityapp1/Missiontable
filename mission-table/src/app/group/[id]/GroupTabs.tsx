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
import ChatPanel from '@/components/ChatPanel';
import { setRsvp, markInvitesSeen } from './loopActions';
import type { MemberLoopData } from './loopTypes';

type Tab = 'month' | 'chat' | 'table' | 'field' | 'together' | 'members';

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
  /** Chat messages from others since this member last opened the chat. */
  chatUnread: number;
  /** Group chat is behind a switch until it launches. */
  chatEnabled: boolean;
  infoSlot?: React.ReactNode;
};

// Short labels keep every tab on one line on phones, with no sideways scrolling.
const TABS: { key: Tab; label: string; short: string }[] = [
  { key: 'month', label: 'This month', short: 'Month' },
  { key: 'chat', label: 'Chat', short: 'Chat' },
  { key: 'table', label: 'Our table', short: 'Table' },
  { key: 'field', label: 'From the field', short: 'Field' },
  { key: 'together', label: 'Eat together', short: 'Together' },
  { key: 'members', label: 'Members', short: 'Members' },
];

function initialTab(t: string | null, chat: boolean): Tab {
  if (t === 'meals') return 'month';
  if (t === 'chat' && !chat) return 'month';
  return (TABS.find((x) => x.key === t)?.key ?? 'month') as Tab;
}

export default function GroupTabs(props: Props) {
  const { loop, token } = props;
  const [active, setActive] = useState<Tab>(() => initialTab(loop.initialTab, props.chatEnabled));
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
  const [chatUnread, setChatUnread] = useState(() => (initialTab(loop.initialTab, props.chatEnabled) === 'chat' ? 0 : props.chatUnread));

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

  function badgeFor(tab: Tab): number {
    return tab === 'chat' ? chatUnread : tab === 'together' ? pendingInvites : 0;
  }

  function tabName(tab: (typeof TABS)[number]): string {
    const n = badgeFor(tab.key);
    if (!n) return tab.label;
    return tab.key === 'chat' ? `${tab.label}, ${n} new message${n === 1 ? '' : 's'}` : `${tab.label}, ${n} invitation${n === 1 ? '' : 's'}`;
  }

  function selectTab(tab: Tab) {
    setActive(tab);
    if (tab === 'chat') setChatUnread(0);
    cleanUrl(tab);
  }

  return (
    <div className="max-w-[820px]">
      <div role="tablist" aria-label="Group sections" className="flex justify-between sm:justify-start sm:gap-6 border-b-2 border-black mb-6">
        {TABS.filter((tab) => tab.key !== 'chat' || props.chatEnabled).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            aria-label={tabName(tab)}
            onClick={() => selectTab(tab.key)}
            className={`relative flex-none inline-flex items-center gap-1 font-inter font-semibold text-[11px] sm:text-xs tracking-[0.03em] sm:tracking-[0.05em] uppercase pt-3 pb-2.5 border-b-[3px] -mb-0.5 transition-colors whitespace-nowrap min-h-[44px] ${
              active === tab.key ? 'border-accent text-black' : 'border-transparent text-warm hover:text-black'
            }`}
          >
            <span className="sm:hidden" aria-hidden="true">{tab.short}</span>
            <span className="hidden sm:inline" aria-hidden="true">{tab.label}</span>
            {badgeFor(tab.key) > 0 && (
              <>
                {/* Phones: a dot that takes no width, so every tab still fits on a 320px screen. */}
                <span aria-hidden="true" className={`sm:hidden absolute top-2 -right-2 w-2 h-2 rounded-full ${tab.key === 'chat' ? 'bg-accent' : 'bg-black'}`} />
                <span aria-hidden="true" className={`hidden sm:inline-flex min-w-[18px] h-[18px] rounded-full text-cream text-[10px] font-bold items-center justify-center px-1 ${tab.key === 'chat' ? 'bg-accent' : 'bg-black'}`}>
                  {badgeFor(tab.key) > 9 ? '9+' : badgeFor(tab.key)}
                </span>
              </>
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
      {active === 'chat' && (
        <ChatPanel
          groupId={loop.groupId}
          token={token}
          as="member"
          outsideChatLink={props.chatLink}
          prompts={[
            'Hi everyone! Looking forward to gathering this month.',
            `Praying for ${props.countryName} this week. Any requests?`,
            'Who’s cooking what this month?',
          ]}
        />
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
