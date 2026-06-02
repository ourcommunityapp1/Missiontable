import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="bg-dark border-t-2 border-black px-6 md:px-16 py-20 md:py-32">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center">
        <h2
          className="font-fraunces font-bold text-5xl md:text-[64px] uppercase tracking-[-0.03em] leading-[1.05] text-white mb-6 fraunces-64"
        >
          READY TO START?
        </h2>
        <p className="font-inter text-muted text-base md:text-lg leading-[1.6] max-w-xl mb-10">
          Help reach the nations by empowering a community by rallying people around meals, scripture and prayer requests.
        </p>
        <Link
          href="/start"
          className="bg-cream text-black font-inter font-semibold text-sm tracking-[0.05em] uppercase px-12 py-5 border-2 border-cream hover:bg-dark hover:text-white transition-colors"
        >
          START A GROUP TODAY
        </Link>
      </div>
    </section>
  );
}
