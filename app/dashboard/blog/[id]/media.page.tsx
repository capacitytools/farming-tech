export default function MediaLibraryPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-extrabold text-forest-800">🖼️ Media Library</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <p className="text-4xl mb-2">📁</p>
        <p className="text-sm font-bold text-gray-700">No images uploaded yet.</p>
        <p className="text-xs text-gray-500 mt-2">All images you upload for your posts will appear here.</p>
      </div>
    </div>
  );
}