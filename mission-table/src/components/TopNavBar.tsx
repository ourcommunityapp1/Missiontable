"use client";

import { useState } from "react";
import Link from "next/link";

export default function TopNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-cream border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-fraunces font-bold text-2xl md:text-[32px] uppercase tracking-[-0.1em] leading-none fraunces-32"
        >
          MISSION TABLE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/browse" className="font-inter text-warm text-base hover:text-black transition-colors">
            Join a Group
          </Link>
          <Link href="/start" className="font-inter text-warm text-base hover:text-black transition-colors">
            Start a Group
          </Link>
          <Link href="/about" className="font-inter text-warm text-base hover:text-black transition-colors">
            About
          </Link>
        </nav>

        <Link
          href="/start"
          className="hidden md:flex bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase px-6 py-3 border-2 border-black hover:bg-cream hover:text-black transition-colors"
        >
          Get Started
        </Link>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-black transition-transform duration-200 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-6 h-0.5 bg-black transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-black transition-transform duration-200 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden border-t-2 border-black bg-cream px-6 py-6 flex flex-col gap-6">
          <Link href="/browse" className="font-inter text-warm text-lg" onClick={() => setMenuOpen(false)}>
            Join a Group
          </Link>
          <Link href="/start" className="font-inter text-warm text-lg" onClick={() => setMenuOpen(false)}>
            Start a Group
          </Link>
          <Link href="/about" className="font-inter text-warm text-lg" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          <Link
            href="/start"
            className="bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase px-6 py-3 border-2 border-black text-center"
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
