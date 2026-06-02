import Image from "next/image";
import Link from "next/link";

const heroImage1 = "https://www.figma.com/api/mcp/asset/0e53c55e-5746-48de-8c97-ed9fe6e4d6e3";
const heroImage2 = "https://www.figma.com/api/mcp/asset/c9a0a514-4cfb-4792-80d7-b2a5c1fd90b5";

export default function HeroSection() {
  return (
    <section className="bg-cream px-6 md:px-16 pt-12 md:pt-24 pb-16 md:pb-0 overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative">

          {/* Heading */}
          <div className="relative z-10 mix-blend-multiply">
            <h1
              className="font-fraunces font-bold text-[72px] md:text-[120px] lg:text-[153px] uppercase leading-[0.85] tracking-[-0.05em] fraunces-32"
            >
              <span className="block text-black">EAT. PRAY.</span>
              <span className="block text-[#918884]">GATHER.</span>
            </h1>
          </div>

          {/* Hero image — mobile: full width below heading, desktop: floats right */}
          <div className="mt-8 md:mt-0 md:absolute md:top-0 md:right-0 md:w-[34%]">
            <div className="relative w-full aspect-[3/2] rounded-[13px] overflow-hidden border-2 border-black">
              <Image
                src={heroImage1}
                alt="A city at dusk"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Second floating image — hidden on mobile */}
          <div className="hidden md:block absolute bottom-[-40px] right-[36%] w-[22%]">
            <div className="relative w-full aspect-[3/2] rounded-[16px] overflow-hidden border-2 border-black">
              <Image
                src={heroImage2}
                alt="Colorful ceramics"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Copy + CTAs */}
          <div className="mt-8 md:mt-12 md:max-w-[512px]">
            <p className="font-inter text-warm text-base md:text-lg leading-[1.6] mb-8">
              Gather a small community monthly for a shared meal, focused prayer, and scripture dedicated to one country for an entire year. A simple rhythm for profound global impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/browse"
                className="bg-black text-white font-inter font-semibold text-sm tracking-[0.05em] uppercase px-8 py-4 border-2 border-black hover:bg-cream hover:text-black transition-colors text-center"
              >
                BROWSE NATIONS
              </Link>
              <Link
                href="/start"
                className="bg-cream text-black font-inter font-semibold text-sm tracking-[0.05em] uppercase px-8 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors text-center"
              >
                START A GROUP
              </Link>
            </div>
          </div>

          {/* Spacer for desktop so images have room */}
          <div className="hidden md:block h-24" />
        </div>
      </div>
    </section>
  );
}
