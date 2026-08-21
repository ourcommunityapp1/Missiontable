'use client';

import { useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { sendHostDashboardLink } from './actions';

export default function HostLoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    await sendHostDashboardLink(email);
    setStatus('sent');
  }

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 py-8 pb-24">
        <div className="max-w-[480px]">

          <div className="border-t-2 border-black pt-4 mb-8">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-2">
              Host Dashboard
            </p>
            <h1 className="font-fraunces font-bold text-[48px] uppercase leading-none tracking-[-0.04em] text-black">
              Find Your Dashboard
            </h1>
          </div>

          {status === 'sent' ? (
            <div className="border-2 border-black p-6">
              <p className="font-inter font-semibold text-sm text-black mb-2">Check your inbox</p>
              <p className="font-inter text-sm text-warm">
                If that email is registered as a host, we've sent your dashboard link. Check your inbox (and spam folder).
              </p>
            </div>
          ) : (
            <>
              <p className="font-inter text-base text-warm mb-8">
                Enter the email address you used when you started your group and we'll send you your dashboard link.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block font-inter text-[10px] font-semibold tracking-[0.1em] uppercase text-black mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full border-2 border-black bg-cream font-inter text-sm px-3 py-2 outline-none focus:border-black"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase py-3 border-2 border-black hover:bg-cream hover:text-black transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? 'Sending…' : 'Send My Dashboard Link →'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>

      <Footer />
    </main>
  );
}
