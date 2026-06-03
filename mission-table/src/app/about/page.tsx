import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'About — Mission Table',
  description: 'What we believe and why Mission Table exists.',
};

const beliefs = [
  {
    title: 'God',
    body: 'We believe in one God, eternally existing in three persons — Father, Son, and Holy Spirit — perfect in holiness, love, and power.',
  },
  {
    title: 'Scripture',
    body: 'We believe the Bible is God\'s own Word, fully trustworthy and authoritative, the final guide for what we believe and how we live.',
  },
  {
    title: 'Humanity',
    body: 'We believe every person is made in God\'s image and precious to him, yet all of us have sinned and need rescue.',
  },
  {
    title: 'Jesus',
    body: 'We believe Jesus Christ is fully God and fully man, that he lived a sinless life, died in our place to bear the punishment for our sin, and rose bodily from the grave in victory.',
  },
  {
    title: 'Salvation',
    body: 'We believe we are saved by grace alone, through faith alone, in Christ alone — never by what we achieve. True faith is living faith, bearing fruit in love and obedience.',
  },
  {
    title: 'The Mission',
    body: 'We believe Jesus has commanded his Church to make disciples of all nations. More than 3 billion people still live with little or no access to the gospel; their names are known to God, and they are worth our prayers, our tables, and our lives.',
  },
  {
    title: 'Hope',
    body: 'We believe Jesus will return to make all things new, and that he will be worshiped by every tribe, tongue, and nation.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <TopNavBar />

      <div className="max-w-[1280px] mx-auto w-full px-6 md:px-16 pt-16 md:pt-24 pb-24">

        {/* Back nav */}
        <div className="mb-10 md:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-inter font-semibold text-sm tracking-[0.05em] uppercase border-b-2 border-black pb-1 hover:text-warm transition-colors"
          >
            <span aria-hidden="true">←</span>
            Home
          </Link>
        </div>

        <div className="max-w-[800px]">

          {/* Page heading */}
          <div className="border-t-2 border-black pt-4 mb-12">
            <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-warm mb-3">
              About
            </p>
            <h1 className="font-fraunces font-bold text-[56px] md:text-[80px] uppercase leading-none tracking-[-0.04em] fraunces-64 text-black mb-8">
              Mission Table Beliefs
            </h1>
            <p className="font-inter text-base md:text-lg text-warm leading-[1.7] max-w-[600px]">
              Mission Table exists to gather believers around the table and the throne — to eat, to pray, and to long for the day when Jesus is known among every people. These are the convictions that hold us together.
            </p>
          </div>

          {/* Beliefs */}
          <div className="flex flex-col">
            {beliefs.map((belief, i) => (
              <div
                key={belief.title}
                className={`py-8 flex flex-col md:flex-row md:items-start gap-3 md:gap-12 border-t-2 border-black ${
                  i === beliefs.length - 1 ? 'border-b-2' : ''
                }`}
              >
                <h2 className="font-fraunces font-bold text-[28px] uppercase leading-none fraunces-32 text-black md:w-[180px] md:flex-none">
                  {belief.title}
                </h2>
                <p className="font-inter text-base text-warm leading-[1.7]">
                  {belief.body}
                </p>
              </div>
            ))}
          </div>

          {/* Attribution */}
          <p className="font-inter text-xs text-muted mt-8">
            Our convictions are shaped by and indebted to the work of{' '}
            <a
              href="https://radical.net"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-black underline"
            >
              Radical
            </a>
            .
          </p>

        </div>
      </div>

      <Footer />
    </main>
  );
}
