const rhythmBlocks = [
  {
    icon: "🍽",
    title: "Eat.",
    body: "Whether altogether or each at your own table: your group host will share a recipe from the country you're praying for.",
  },
  {
    icon: "🙏",
    title: "Pray.",
    body: "Your host will help you connect with prayer requests from local believers in that specific nation and stay intimately connected to how God is working in that nation.",
  },
  {
    icon: "📖",
    title: "Read.",
    body: "Before your meal your group will read a short passage that helps your group develop a heart for the Great Commission.",
  },
  {
    icon: "🪑",
    title: "Gather.",
    body: "Build lasting relationships with those across your own table and others eating, gathering, and praying for the same country on the same day.",
  },
];

export default function MonthlyRhythm() {
  return (
    <section className="bg-cream-dark border-t-2 border-black px-6 md:px-16 py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-12 md:mb-16">
          <h2
            className="font-fraunces font-bold text-4xl md:text-5xl tracking-[-0.02em] leading-[1.1] mb-4 fraunces-48"
          >
            How it works
          </h2>
          <p className="font-inter text-warm text-base max-w-2xl">
            Whether it&apos;s all the same location, or whether every family gathers in their own home: you will all share the same rhythm.
          </p>
        </div>

        {/* Rhythm blocks — 1 col mobile, 2 col desktop */}
        <div className="border-2 border-black grid grid-cols-1 md:grid-cols-2">
          {rhythmBlocks.map((block, i) => (
            <div
              key={block.title}
              className={`bg-cream p-8 md:p-12 flex flex-col gap-4 ${
                i < rhythmBlocks.length - 1 ? "border-b-2 md:border-b-0 border-black" : ""
              } ${
                i % 2 === 0 && i < rhythmBlocks.length - 1 ? "md:border-r-2 md:border-black" : ""
              } ${
                i < 2 ? "md:border-b-2 md:border-black" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">{block.icon}</span>
                <h3
                  className="font-fraunces font-bold text-3xl leading-none fraunces-32"
                >{block.title}</h3>
              </div>
              <p className="font-inter text-warm text-base leading-[1.6]">{block.body}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
