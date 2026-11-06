import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-forest-950 pb-24">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <Link href="/" className="text-sm font-bold text-forest-200 hover:text-white mb-2 inline-block">
          ← Back to Farming Tech & Business
        </Link>
        <h1 className="text-2xl font-extrabold">Legal & Trust Center</h1>
        <p className="text-xs text-forest-100 mt-1">Transparency, policies, and contact information.</p>
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="prose prose-sm md:prose-base prose-green max-w-none text-gray-800 dark:text-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}