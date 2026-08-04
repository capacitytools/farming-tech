import Link from 'next/link';

export interface Tribe {
  slug: string;
  name: string;
  icon: string;
  member_count: number;
}

export default function TribesRail({ tribes }: { tribes: Tribe[] }) {
  if (!tribes?.length) return null;

  return (
    <section className="px-4 pt-5">
      <h2 className="app-heading mb-3">Your Tribes</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {tribes.map((tribe) => (
          <Link
            key={tribe.slug}
            href={`/communities/${tribe.slug}`}
            className="glass-card-sm flex-shrink-0 w-24 py-4 flex flex-col items-center gap-1.5"
          >
            <span className="text-3xl">{tribe.icon}</span>
            <span className="text-xs font-bold text-forest-800 dark:text-forest-100 text-center">
              {tribe.name}
            </span>
            <span className="text-[10px] text-forest-400">
              {tribe.member_count.toLocaleString()} members
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
