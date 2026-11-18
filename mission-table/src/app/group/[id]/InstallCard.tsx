'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = 'mt-install-dismissed';
const noopSubscribe = () => () => {};

function readEnv() {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  let dismissed = false;
  try { dismissed = localStorage.getItem(KEY) === '1'; } catch { /* storage unavailable */ }
  return { hide: standalone || dismissed, ios: /iPhone|iPad|iPod/.test(navigator.userAgent) };
}

export default function InstallCard({ groupName }: { groupName: string }) {
  // Only decide on the client, after hydration, so server and client markup match.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [dismissed, setDismissed] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!isClient || dismissed) return null;
  const env = readEnv();
  if (env.hide) return null;

  function dismiss() {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  }

  return (
    <section aria-labelledby="install-title" className="mt-10 border-2 border-dashed border-black bg-cream-dark p-5 flex flex-col gap-3 max-w-[560px]">
      <h2 id="install-title" className="font-fraunces font-semibold text-[21px] tracking-[-0.02em] text-black">Put {groupName} on your phone</h2>
      {deferred ? (
        <>
          <p className="font-inter text-sm text-warm">Open this month&apos;s meal, answer “Are you in?” and see invitations in one tap.</p>
          <button
            type="button"
            onClick={async () => { await deferred.prompt(); setDeferred(null); dismiss(); }}
            className="self-start min-h-[44px] bg-black text-cream font-inter font-semibold text-[13px] tracking-[0.06em] uppercase px-5"
          >
            Add to home screen
          </button>
        </>
      ) : env.ios ? (
        <p className="font-inter text-sm text-[#3A372F] leading-relaxed">
          In Safari, tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>. It opens straight to your group.
        </p>
      ) : (
        <p className="font-inter text-sm text-[#3A372F] leading-relaxed">
          Open this page on your phone and use your browser&apos;s <strong>Add to Home Screen</strong> option. It opens straight to your group.
        </p>
      )}
      <button type="button" onClick={dismiss} className="self-start font-inter text-xs text-warm underline min-h-[44px]">Don&apos;t show this again</button>
    </section>
  );
}
