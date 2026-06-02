import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-dark border-t-2 border-black px-6 md:px-16 py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">

        {/* Logo + copyright */}
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="font-fraunces font-bold text-4xl md:text-5xl uppercase tracking-[-0.05em] text-white leading-none fraunces-48"
          >
            MISSION TABLE
          </Link>
          <p className="font-inter text-muted text-base">
            © 2024 Mission Table. A record of movement.
          </p>
        </div>

        {/* Footer nav */}
        <nav className="grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-8">
          {["Privacy Policy", "Terms of Service", "Contact Us", "Global Impact"].map((label) => (
            <Link
              key={label}
              href="#"
              className="font-inter text-muted text-base hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

      </div>
    </footer>
  );
}
