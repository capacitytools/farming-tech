import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-10 text-center">
      <p className="text-6xl mb-4">🌾</p>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6">The field you're looking for doesn't exist.</p>
      <Link href="/" className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold inline-block">
        Back to Home
      </Link>
    </div>
  );
}