'use client';

import { useEffect, useRef, useState } from 'react';
import type { FieldPostWithEngagement } from '@/lib/queries';
import { initialsOf } from '@/lib/people';
import HomeTab from './HomeTab';
import MonthTab from './MonthTab';
import { phaseOf } from './phase';
import MembersSheet from './MembersSheet';
import CompanySheet from './CompanySheet';
import InvitePopup from './InvitePopup';
import InviteModal from './InviteModal';
import InstallModal, { type DeferredInstall } from './InstallModal';
import InstallCard from './InstallCard';
import { currentInstallEnv, installMarkedDone, installNudgeAllowed, markInstallDone, snoozeInstall, type InstallEnv } from './installEnv';
import { setRsvp, markInvitesSeen, recordAppOpen } from './loopActions';
import { track } from '@/lib/mixpanel';
import type { GroupInfo, KitWithMeta, MemberLoopData } from './loopTypes';

type Tab = 'home' | 'month';

type Props = {
  token: string;
  info: GroupInfo;
  loop: MemberLoopData;
  kits: KitWithMeta[];
  fieldPosts: FieldPostWithEngagement[];
  /** Chat messages from others since this member last read the chat. */
  chatUnread: number;
  /** Opened from the "put it on your phone" email (?install=1). */
  installRequested?: boolean;
};

// Links from emails and older versions of the app still land in the right place.
const MONTH_TABS = new Set(['month', 'meals', 'table', 'together']);
const initialTab = (t: string | null): Tab => (t && MONTH_TABS.has(t) ? 'month' : 'home');

export default function MemberApp({ token, info, loop, kits, fieldPosts, chatUnread, installRequested = false }: Props) {
  const [tab, setTab] = useState<Tab>(() => initialTab(loop.initialTab));
  const [membersOpen, setMembersOpen] = useState(loop.initialTab === 'members');
  const [friendInviteOpen, setFriendInviteOpen] = useState(false);
  const [inviteFlowOpen, setInviteFlowOpen] = useState(false);
  const [myRsvp, setMyRsvp] = useState(() =>
    loop.autoRsvp && loop.autoRsvp.date === loop.nextDate ? loop.autoRsvp.status : loop.myRsvp,
  );
  const [inCount, setInCount] = useState(loop.inMembers.length);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [toast, setToast] = useState(() =>
    loop.autoRsvp && loop.autoRsvp.date !== loop.nextDate ? 'That gathering has already happened.' : '',
  );
  const [popup, setPopup] = useState(() =>
    loop.autoRsvp ? null : loop.received.find((i) => i.myStatus === 'invited' && !i.mySeen) ?? null,
  );
  const [unread, setUnread] = useState(() => (initialTab(loop.initialTab) === 'home' ? 0 : chatUnread));
  const handledLink = useRef(false);

  // ── Home-screen app ──
  const [install, setInstall] = useState<{ env: InstallEnv } | null>(null);
  const [deferred, setDeferred] = useState<DeferredInstall | null>(null);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const overlayOpen = useRef(false);
  const anyOverlay = !!popup || companyOpen || membersOpen || friendInviteOpen || inviteFlowOpen;
  useEffect(() => { overlayOpen.current = anyOverlay; }, [anyOverlay]);

  function openInstall(trigger: 'email' | 'auto' | 'card') {
    const env = currentInstallEnv();
    setInstall({ env });
    track('install_modal_shown', { group_id: loop.groupId, trigger, kind: env.kind });
  }
  function closeInstall(outcome: 'done' | 'later') {
    if (outcome === 'done') markInstallDone(); else snoozeInstall();
    if (outcome === 'done') setShowInstallCard(false);
    track('install_modal_closed', { group_id: loop.groupId, outcome, kind: install?.env.kind });
    setInstall(null);
  }
  async function runInstallPrompt() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    track('install_prompt_answered', { group_id: loop.groupId, outcome });
    setDeferred(null);
    if (outcome === 'accepted') { markInstallDone(); setShowInstallCard(false); setInstall(null); }
  }

  useEffect(() => {
    const env = currentInstallEnv();
    // Opened from the home screen: note it once per session so hosts can see who has the app.
    if (env.kind === 'standalone') {
      try {
        if (sessionStorage.getItem('mt-app-open') !== loop.groupId) {
          sessionStorage.setItem('mt-app-open', loop.groupId);
          void recordAppOpen(token, loop.groupId, env.platform);
        }
      } catch { void recordAppOpen(token, loop.groupId, env.platform); }
      return;
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as DeferredInstall); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const timers: ReturnType<typeof setTimeout>[] = [];
    // The card stays until "I've added it"; "Remind me later" only pauses the pop-up.
    timers.push(setTimeout(() => setShowInstallCard(!installMarkedDone()), 0));
    if (installRequested) {
      timers.push(setTimeout(() => openInstall('email'), 400));
    } else if (env.kind !== 'desktop' && installNudgeAllowed()) {
      // Once per visit on a phone, after a moment, and never on top of another pop-up.
      timers.push(setTimeout(() => {
        let shown = false;
        try { shown = sessionStorage.getItem('mt-install-shown') === '1'; sessionStorage.setItem('mt-install-shown', '1'); } catch { /* ignore */ }
        if (!shown && !overlayOpen.current) openInstall('auto');
      }, 6000));
    }
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingInvites = loop.received.filter((i) => i.myStatus === 'invited').length;
  const phase = phaseOf(loop);
  const sharedTable = loop.tablePosts.some((p) => p.memberId === loop.me.id && p.meetingDate === loop.tableDate);
  const monthNeedsYou = (!!loop.nextDate && myRsvp === null) || pendingInvites > 0 || (phase === 'after' && !sharedTable);

  function cleanUrl(t: Tab) {
    const q = new URLSearchParams({ token });
    if (t === 'month') q.set('tab', 'month');
    window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
  }

  function selectTab(t: Tab) {
    setTab(t);
    if (t === 'home') setUnread(0);
    cleanUrl(t);
    window.scrollTo({ top: 0 });
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
    if (status === 'in') setCompanyOpen(true);
    else setToast('Thanks for letting us know. We’ll miss you at the table.');
  }

  function answer(status: 'in' | 'out') {
    const prev = myRsvp;
    setMyRsvp(status);
    void save(status, prev);
  }

  // One-tap answers from the "Are you in?" email arrive as ?rsvp=in|out&date=…
  useEffect(() => {
    if (handledLink.current) return;
    handledLink.current = true;
    // Defer: Next's router syncs the URL in its own (parent) effect, which runs after ours.
    setTimeout(() => cleanUrl(tab), 0);
    if (!loop.autoRsvp || loop.autoRsvp.date !== loop.nextDate) return;
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

  const everyone = [...loop.directory, loop.me];
  const faces = [...loop.directory.slice(0, 3), loop.me];
  const tabs: { key: Tab; text: string; badge: React.ReactNode }[] = [
    {
      key: 'home',
      text: 'Home',
      badge: unread > 0 && tab !== 'home' ? (
        <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-cream text-[10px] font-bold inline-flex items-center justify-center px-1 tracking-normal">{unread > 9 ? '9+' : unread}</span>
      ) : null,
    },
    {
      key: 'month',
      text: 'This month',
      badge: monthNeedsYou && tab !== 'month' ? <span className="w-[7px] h-[7px] rounded-full bg-black" /> : null,
    },
  ];
  const tabName = (t: (typeof tabs)[number]) =>
    t.key === 'home' && unread > 0 && tab !== 'home' ? `Home, ${unread} new message${unread === 1 ? '' : 's'}`
      : t.key === 'month' && monthNeedsYou && tab !== 'month' ? 'This month, needs your answer'
      : t.text;

  return (
    <div className="max-w-[680px] mx-auto w-full px-4 pb-16">
      <header className="flex flex-col gap-2.5 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-inter font-semibold text-[10px] tracking-[0.12em] uppercase text-warm">{info.countryName} · {info.rhythm}</p>
            <h1 className="font-fraunces font-bold text-[24px] md:text-[30px] leading-[1.05] tracking-[-0.02em] text-black">{info.name}</h1>
          </div>
          <button
            type="button"
            onClick={() => setFriendInviteOpen(true)}
            aria-label="Invite a friend to the group"
            className="flex-none w-11 h-11 border-2 border-black flex items-center justify-center hover:bg-black hover:text-cream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><path d="M19 8v6M16 11h6" /></svg>
          </button>
        </div>
        <button type="button" onClick={() => setMembersOpen(true)} className="self-start min-h-[44px] flex items-center gap-2.5">
          <span className="flex" aria-hidden="true">
            {faces.map((m, i) => (
              <span
                key={m.id}
                style={{ marginLeft: i ? -6 : 0 }}
                className={`w-[30px] h-[30px] rounded-full border-2 border-cream flex items-center justify-center font-inter font-semibold text-[10px] tracking-[-0.02em] ${m.id === loop.me.id ? 'bg-black text-cream' : 'bg-[#E7E3DA] text-black'}`}
              >
                {initialsOf(m.name)}
              </span>
            ))}
          </span>
          <span className="font-inter text-[13px] font-semibold text-black border-b-2 border-black pb-px">{everyone.length} members →</span>
        </button>
        <div role="tablist" aria-label="Group sections" className="grid grid-cols-2 border-b-2 border-black">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              aria-label={tabName(t)}
              onClick={() => selectTab(t.key)}
              className={`min-h-[46px] -mb-0.5 border-b-[3px] inline-flex items-center justify-center gap-1.5 font-inter text-xs tracking-[0.08em] uppercase ${
                tab === t.key ? 'border-accent text-black font-bold' : 'border-transparent text-warm font-semibold hover:text-black'
              }`}
            >
              <span aria-hidden="true">{t.text}</span>
              {t.badge}
            </button>
          ))}
        </div>
      </header>

      <div className="pt-4">
        {tab === 'home' ? (
          <HomeTab
            token={token}
            loop={loop}
            info={info}
            kits={kits}
            fieldPosts={fieldPosts}
            myRsvp={myRsvp}
            inCount={inCount}
            onAnswer={answer}
            onOpenMonth={() => selectTab('month')}
          />
        ) : (
          <MonthTab
            token={token}
            loop={loop}
            info={info}
            kits={kits}
            myRsvp={myRsvp}
            inCount={inCount}
            onAnswer={answer}
            inviteFlowOpen={inviteFlowOpen}
            setInviteFlowOpen={setInviteFlowOpen}
            installSlot={showInstallCard ? <InstallCard groupName={info.name} iconUrl={info.iconUrl} onShowHow={() => openInstall('card')} /> : null}
          />
        )}
      </div>

      {membersOpen && (
        <MembersSheet
          info={info}
          me={loop.me}
          directory={loop.directory}
          onInviteFriend={() => { setMembersOpen(false); setFriendInviteOpen(true); }}
          onClose={() => setMembersOpen(false)}
        />
      )}
      {friendInviteOpen && <InviteModal groupId={info.id} onClose={() => setFriendInviteOpen(false)} />}

      {companyOpen && loop.nextDate && (
        <CompanySheet
          nextDate={loop.nextDate}
          me={loop.me}
          directory={loop.directory}
          onInvite={() => { setCompanyOpen(false); setTab('month'); cleanUrl('month'); setInviteFlowOpen(true); window.scrollTo({ top: 0 }); }}
          onClose={() => setCompanyOpen(false)}
        />
      )}

      {!companyOpen && popup && (
        <InvitePopup
          invite={popup}
          token={token}
          onLater={() => {
            void markInvitesSeen(token, loop.groupId, [popup.id]);
            setPopup(null);
          }}
        />
      )}

      {install && (
        <InstallModal
          env={install.env}
          groupName={info.name}
          shortName={info.shortName}
          iconUrl={info.iconUrl}
          appUrl={typeof window === 'undefined' ? '' : `${window.location.origin}/group/${info.id}?token=${token}&install=1`}
          deferred={deferred}
          onInstallPrompt={() => void runInstallPrompt()}
          onDone={() => closeInstall('done')}
          onLater={() => closeInstall('later')}
        />
      )}

      {toast && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 bg-black text-cream font-inter text-sm px-5 py-3 max-w-[90vw] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
