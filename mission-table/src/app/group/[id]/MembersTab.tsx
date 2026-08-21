'use client';

type Member = { id: string; name: string; city: string | null; state: string | null };

type Props = {
  members: Member[];
  chatLink: string | null;
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export default function MembersTab({ members, chatLink }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="font-inter font-semibold text-xs tracking-[0.1em] uppercase text-black">
          {members.length} {members.length === 1 ? 'Member' : 'Members'}
        </p>
        {chatLink && (
          <a
            href={chatLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-inter font-semibold text-xs tracking-[0.05em] uppercase border-b-2 border-black pb-0.5 hover:text-warm transition-colors"
          >
            Join Chat →
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-[760px]">
        {members.map((m) => (
          <div key={m.id} className="border-2 border-black bg-cream p-4 flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full border-2 border-black bg-cream-dark flex items-center justify-center font-fraunces text-xs text-black flex-none">
              {initials(m.name)}
            </div>
            <div className="min-w-0">
              <p className="font-inter text-sm font-semibold text-black truncate">{m.name}</p>
              {(m.city || m.state) && (
                <p className="font-inter text-xs text-warm truncate">{[m.city, m.state].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
