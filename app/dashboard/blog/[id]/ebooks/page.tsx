export default function MyEbooksPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-extrabold text-forest-800">📚 My E-books</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <p className="text-4xl mb-2">📖</p>
        <p className="text-sm font-bold text-gray-700">You haven't published any E-books yet.</p>
        <p className="text-xs text-gray-500 mt-2 mb-4">Upload your PDF, set a price, and start selling to your audience.</p>
        <button className="bg-forest-600 text-white px-6 py-2 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed">Upload (Coming Soon)</button>
      </div>
    </div>
  );
}