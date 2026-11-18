'use client';

import { useEffect, useRef, useState } from 'react';
import { preconnect } from 'react-dom';
import Image from 'next/image';
import { toEmbeddable, siteName, type VideoProvider } from '@/lib/video';

type Props = {
  url: string;
  /** The post's own photo, used as the preview when there is one. */
  posterUrl?: string | null;
  /** Who/what the video is from, for screen readers. */
  title: string;
};

const PROVIDER_NAME: Record<VideoProvider, string> = { youtube: 'YouTube', vimeo: 'Vimeo', facebook: 'Facebook' };

// Hosts each player needs first. Connecting while the video scrolls into view
// (no request is made, just DNS + TLS) lets it start sooner when tapped.
const WARM: Record<VideoProvider, string[]> = {
  youtube: ['https://www.youtube-nocookie.com', 'https://www.google.com', 'https://i.ytimg.com'],
  vimeo: ['https://player.vimeo.com', 'https://i.vimeocdn.com', 'https://f.vimeocdn.com'],
  facebook: ['https://www.facebook.com', 'https://static.xx.fbcdn.net'],
};

function PlayBadge() {
  return (
    <div className="w-14 h-14 rounded-full bg-cream/95 border-2 border-black flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="#1C1B1B" className="w-4 h-4 ml-0.5" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
    </div>
  );
}

/**
 * Plays YouTube, Vimeo and Facebook videos inside the app. The player loads
 * when the member taps play. Other links open the site in a new tab.
 */
export default function VideoEmbed({ url, posterUrl, title }: Props) {
  const video = toEmbeddable(url);
  const [playing, setPlaying] = useState(false);
  const [lastUrl, setLastUrl] = useState(url);
  const [posterIndex, setPosterIndex] = useState(0);
  // A different link (the host editing the preview) starts from the poster again.
  if (url !== lastUrl) { setLastUrl(url); setPlaying(false); setPosterIndex(0); }

  const box = useRef<HTMLDivElement>(null);
  const provider = video?.provider ?? null;
  useEffect(() => {
    const el = box.current;
    if (!provider || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      for (const origin of WARM[provider]) preconnect(origin);
      io.disconnect();
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [provider]);

  if (!video) {
    if (!/^https?:\/\//i.test(url.trim())) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-full h-[220px] block bg-dark"
        aria-label={`Watch video from ${title} on ${siteName(url)}`}
      >
        {posterUrl && <Image src={posterUrl} alt="" fill unoptimized className="object-cover" />}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center"><PlayBadge /></div>
        <span className="absolute left-3 bottom-3 font-inter text-xs font-semibold text-cream">Watch on {siteName(url)} ↗</span>
      </a>
    );
  }

  const posters = [...(posterUrl ? [posterUrl] : []), ...video.thumbnailUrls];
  const poster = posters[posterIndex] ?? null;
  // Wide videos fill the width. Tall ones (Shorts, Reels) fill the width on phones,
  // and are capped to the screen height on bigger screens.
  const frame = video.vertical
    ? 'relative aspect-[9/16] w-full max-w-[calc((100svh-64px)*9/16)] mx-auto bg-black'
    : 'relative aspect-video w-full bg-black';

  return (
    <div ref={box}>
      <div className={frame}>
        {playing ? (
          <iframe
            src={video.embedUrl}
            title={`Video from ${title}`}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group"
            aria-label={`Play video from ${title}`}
          >
            {poster && (
              <Image
                key={poster}
                src={poster}
                alt=""
                fill
                unoptimized
                className="object-cover"
                // YouTube answers a missing image with a tiny placeholder: try the next one.
                onLoad={(e) => { if (e.currentTarget.naturalWidth <= 120) setPosterIndex((i) => i + 1); }}
                onError={() => setPosterIndex((i) => i + 1)}
              />
            )}
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center"><PlayBadge /></div>
            <span className="absolute left-3 bottom-3 font-inter text-xs font-semibold text-cream [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">Play · {video.label}</span>
          </button>
        )}
      </div>
      <div className="flex justify-end px-4 pt-2">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center min-h-[28px] font-inter text-[11px] font-semibold text-warm underline-offset-2 hover:underline"
        >
          Open in {PROVIDER_NAME[video.provider]} ↗
        </a>
      </div>
    </div>
  );
}
