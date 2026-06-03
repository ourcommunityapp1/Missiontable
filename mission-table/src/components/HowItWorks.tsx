const steps = [
  {
    number: '01',
    title: 'Find Your Nation',
    body: 'Browse countries and find the one God is calling you to pray for.',
  },
  {
    number: '02',
    title: 'Join Your Group',
    body: 'Connect with a local or global community sharing your heart for that nation.',
  },
  {
    number: '03',
    title: 'Receive the Agenda',
    body: 'Your host shares an agenda: a traditional recipe from that country, specific prayer requests from the field, and a short scripture passage.',
  },
  {
    number: '04',
    title: 'Gather',
    body: 'Gather for dinner — simultaneously with members across states or countries — eating the same meal, reading the same Word, and interceding for the lost.',
  },
  {
    number: '05',
    title: 'Share the Movement',
    body: 'Connect with your group, share photos of your table, and witness how God moves in response to unified prayer.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-cream border-t-2 border-black px-6 md:px-16 py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="border-b-2 border-black pb-6 mb-12 md:mb-16">
          <h2 className="font-fraunces font-bold text-4xl md:text-5xl tracking-[-0.02em] leading-[1.1] fraunces-48">
            How It Works
          </h2>
        </div>

        {/* Steps — stack on mobile, 5-col on desktop */}
        <div className="flex flex-col md:flex-row md:divide-x-2 md:divide-black border-2 border-black">
          {steps.map((step) => (
            <div key={step.number} className="flex-1 p-6 md:p-8 border-b-2 border-black md:border-b-0 last:border-b-0">
              <p className="font-fraunces font-bold text-[48px] md:text-[56px] leading-none tracking-[-0.02em] fraunces-64 text-muted mb-4">
                {step.number}
              </p>
              <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black mb-3">
                {step.title}
              </p>
              <p className="font-inter text-sm text-warm leading-[1.6]">
                {step.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
