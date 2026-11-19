'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { InstallEnv } from './installEnv';

export type DeferredInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

type Props = {
  env: InstallEnv;
  groupName: string;
  /** What the icon will say under it on the home screen. */
  shortName: string;
  iconUrl: string;
  /** This member's link, for the QR code on a computer. */
  appUrl: string;
  deferred: DeferredInstall | null;
  onInstallPrompt: () => void;
  onDone: () => void;
  onLater: () => void;
};

const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

function ShareIcon() {
  return <svg {...ICON}><path d="M12 15V3" /><path d="M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>;
}
function MenuIcon() {
  return <svg {...ICON}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
}
function AddIcon() {
  return <svg {...ICON}><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M12 8v8M8 12h8" /></svg>;
}
function DotsIcon({ vertical = false }: { vertical?: boolean }) {
  return (
    <svg {...ICON} fill="currentColor" stroke="none">
      {vertical
        ? <><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></>
        : <><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></>}
    </svg>
  );
}
function Check() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true" className="flex-none mt-0.5"><path d="M5 12l5 5L20 7" /></svg>;
}

type Step = { icon?: React.ReactNode; title: React.ReactNode; hint?: React.ReactNode };

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="list-none m-0 p-0 flex flex-col border-t-2 border-black">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3 py-3 border-b border-black">
          <span aria-hidden="true" className="w-7 h-7 flex-none rounded-full bg-black text-cream font-inter font-bold text-[13px] flex items-center justify-center">{i + 1}</span>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5 pt-0.5">
            <p className="font-inter text-[15px] leading-snug text-black flex flex-wrap items-center gap-x-1.5">{s.title}</p>
            {s.hint && <p className="font-inter text-[13px] leading-snug text-warm">{s.hint}</p>}
          </div>
          {s.icon && <span aria-hidden="true" className="w-10 h-10 flex-none border-2 border-black flex items-center justify-center text-[#0A66D8] bg-white">{s.icon}</span>}
        </li>
      ))}
    </ol>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
      }}
      className="min-h-[44px] px-4 border-2 border-black font-inter text-[13px] font-semibold"
    >
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );
}

/** Shows this person, on this device, how to put the group on their home screen. */
export default function InstallModal(props: Props) {
  const { env, groupName, shortName, iconUrl, appUrl, deferred, onInstallPrompt, onDone, onLater } = props;
  const [qr, setQr] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onLater(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onLater]);

  useEffect(() => {
    if (env.kind !== 'desktop') return;
    let live = true;
    void QRCode.toString(appUrl, { type: 'svg', margin: 1, color: { dark: '#1C1B1B', light: '#FFFFFF' } }).then((svg) => { if (live) setQr(svg); });
    return () => { live = false; };
  }, [env.kind, appUrl]);

  let body: React.ReactNode;
  if (env.kind === 'ios-safari') {
    // Current Safari keeps Share in the ☰ menu of the address bar; older versions show it in the toolbar.
    body = (
      <Steps
        steps={[
          {
            icon: <MenuIcon />,
            title: <>Tap <strong>☰</strong> in the address bar</>,
            hint: <>On older iPhones, skip this: the <strong>Share</strong> button <span className="inline-flex align-middle"><ShareIcon /></span> is at the bottom of the screen (top right on iPad).</>,
          },
          { icon: <ShareIcon />, title: <>Tap <strong>Share</strong></>, hint: 'It’s at the top of the menu.' },
          { icon: <AddIcon />, title: <>Scroll down, tap <strong>Add to Home Screen</strong></>, hint: 'You may need to tap “More” or scroll the list.' },
          { title: <>Tap <strong>Add</strong></>, hint: `“${shortName}” appears on your home screen. Open it from there from now on.` },
        ]}
      />
    );
  } else if (env.kind === 'ios-other') {
    body = (
      <Steps
        steps={[
          {
            icon: <ShareIcon />,
            title: <>Tap the <strong>Share</strong> button</>,
            hint: <>In {env.browser} it’s in the address bar or the <span className="inline-flex align-middle"><DotsIcon /></span> menu.</>,
          },
          { icon: <AddIcon />, title: <>Scroll down, tap <strong>Add to Home Screen</strong></>, hint: 'You may need to tap “More” or scroll the list.' },
          { title: <>Tap <strong>Add</strong></>, hint: `“${shortName}” appears on your home screen. Open it from there from now on.` },
        ]}
      />
    );
  } else if (env.kind === 'in-app') {
    body = (
      <>
        <Steps
          steps={[
            { icon: <DotsIcon vertical={env.platform === 'android'} />, title: <>Tap the <strong>menu</strong> in the corner</>, hint: 'This page opened inside another app, which can’t add it to your home screen.' },
            { title: <>Choose <strong>{env.platform === 'ios' ? 'Open in Safari' : 'Open in Chrome'}</strong></>, hint: 'Or “Open in browser”.' },
            { title: <>Follow the steps there</>, hint: 'Your group opens with these instructions for your browser.' },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <span className="font-inter text-[13px] text-warm">No menu?</span>
          <CopyLink url={appUrl} />
          <span className="font-inter text-[13px] text-warm">and paste it into {env.platform === 'ios' ? 'Safari' : 'Chrome'}.</span>
        </div>
      </>
    );
  } else if (env.kind === 'android') {
    body = deferred ? (
      <button type="button" onClick={onInstallPrompt} className="w-full min-h-[52px] bg-black text-cream font-inter font-bold text-sm tracking-[0.06em] uppercase">
        Add to home screen
      </button>
    ) : (
      <Steps
        steps={[
          { icon: <DotsIcon vertical />, title: <>Tap the <strong>menu</strong> at the top right</> },
          { icon: <AddIcon />, title: <>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong></>, hint: env.browser === 'Samsung Internet' ? 'In Samsung Internet: ≡ menu → Add page to → Home screen.' : undefined },
          { title: <>Tap <strong>Add</strong> or <strong>Install</strong></>, hint: `“${shortName}” appears on your home screen.` },
        ]}
      />
    );
  } else {
    body = (
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div
          role="img"
          aria-label="QR code that opens your group on your phone"
          className="w-[168px] h-[168px] flex-none border-2 border-black bg-white p-1.5 [&>svg]:w-full [&>svg]:h-full"
          // The SVG is generated locally by the qrcode library from this member's own link.
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <div className="flex flex-col gap-2">
          <p className="font-inter text-[15px] leading-snug text-black"><strong>Point your phone’s camera at this code.</strong> Your group opens with the steps for your phone.</p>
          <p className="font-inter text-[13px] text-warm">Or open the email from Mission Table on your phone.</p>
          {deferred && (
            <button type="button" onClick={onInstallPrompt} className="self-start min-h-[44px] px-4 border-2 border-black font-inter text-[13px] font-semibold">
              Install on this computer instead
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onLater} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="relative w-full sm:max-w-[460px] max-h-[92svh] overflow-y-auto overscroll-contain bg-cream border-2 border-black px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] flex flex-col gap-4"
      >
        <button type="button" onClick={onLater} aria-label="Close" className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="flex items-center gap-3.5 pr-10">
          <figure className="m-0 flex flex-col items-center gap-1 flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconUrl} alt="" width={60} height={60} className="w-[60px] h-[60px] rounded-[14px] object-cover shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
            <figcaption className="font-inter text-[11px] text-black max-w-[92px] truncate">{shortName}</figcaption>
          </figure>
          <h2 ref={heading} tabIndex={-1} id="install-title" className="font-fraunces font-bold text-[24px] leading-[1.1] tracking-[-0.02em] text-black outline-none">
            {env.kind === 'desktop' ? `Put ${groupName} on your phone` : `Add ${groupName} to your home screen`}
          </h2>
        </div>

        <ul className="list-none m-0 p-0 flex flex-col gap-1.5 font-inter text-[14px] text-[#3A372F]">
          <li className="flex gap-2"><Check />Opens straight to your group, no link to find</li>
          <li className="flex gap-2"><Check />Messages, the meal and “Are you in?” in one tap</li>
          <li className="flex gap-2"><Check />Free. No app store, no password</li>
        </ul>

        {body}

        <div className="flex flex-col gap-1 pt-1">
          {env.kind !== 'desktop' && !(env.kind === 'android' && deferred) && (
            <button type="button" onClick={onDone} className="min-h-[48px] bg-black text-cream font-inter font-bold text-[13px] tracking-[0.06em] uppercase">
              I’ve added it
            </button>
          )}
          <button type="button" onClick={onLater} className="min-h-[44px] font-inter font-semibold text-sm text-warm">
            Remind me later
          </button>
        </div>
      </section>
    </div>
  );
}
