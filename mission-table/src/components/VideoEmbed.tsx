'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toEmbeddable, siteName } from '@/lib/video';

type Props = {
  url: string;
  /** The post's own photo, used as the preview when there is one. */
  posterUrl?: string | null;
  /** Who/what the video is from, for screen readers. */
  title: string;
};

function PlayBadge() {
  return (
    <div className="w-14 h-14 rounded-full bg-cream/95 border-2 border-black flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="#1C1B1B" className="w-4 h-4 ml-0.5" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
    </div>
  );
}

/**
 * Plays YouTube, Vimeo and Facebook videos inside the app. Nothing loads from the
 * video site until the member taps play. Other links open the site in a new tab.
 */
export default function VideoEmbed({ url, posterUrl, title }: Props) {
  const video = toEmbeddable(url);
  const [playing, setPlaying] = useState(false);
  const [lastUrl, setLastUrl] = useState(url);
  const [posterFailed, setPosterFailed] = useState(false);
  // A different link (the host editing the preview) starts from the poster again.
  if (url !== lastUrl) { setLastUrl(url); setPlaying(false); setPosterFailed(false); }

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

  const poster = posterUrl ?? video.thumbnailUrl;
  // Tall videos are as tall as fits on screen; wide ones fill the width.
  const frame = video.vertical
    ? 'relative aspect-[9/16] w-[min(100%,calc(60svh*9/16))] mx-auto'
    : 'relative aspect-video w-full';

  return (
    <div className="bg-dark">
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
            {poster && !posterFailed && <Image src={poster} alt="" fill unoptimized className="object-cover" onError={() => setPosterFailed(true)} />}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center"><PlayBadge /></div>
            <span className="absolute left-3 bottom-3 font-inter text-xs font-semibold text-cream">Play · {video.label}</span>
          </button>
        )}
      </div>
      <div className="flex justify-end px-3 py-1.5">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center min-h-[28px] font-inter text-[11px] font-semibold text-cream/75 hover:text-cream"
        >
          Open in {video.provider === 'youtube' ? 'YouTube' : video.provider === 'vimeo' ? 'Vimeo' : 'Facebook'} ↗
        </a>
      </div>
    </div>
  );
}
