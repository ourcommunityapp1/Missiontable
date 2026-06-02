import TopNavBar from "@/components/TopNavBar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Join a Group — Mission Table",
  description: "Join a Mission Table group.",
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-[560px] w-full border-2 border-black p-8 md:p-12">
          <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-4">
            Coming Soon
          </p>
          <h1 className="font-fraunces font-bold text-[48px] md:text-[64px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-black mb-4">
            Join a Group
          </h1>
          <p className="font-inter text-base text-warm mb-8">
            The group joining flow is being built. Check back soon — or go explore the nations in the meantime.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
          >
            <span aria-hidden="true">←</span>
            Browse Nations
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
