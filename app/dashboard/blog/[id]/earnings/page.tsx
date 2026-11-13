export default function EarningsPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-extrabold text-forest-800">📊 Earnings & Ads</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <p className="text-4xl font-extrabold text-forest-800">$0.00</p>
        <p className="text-xs text-gray-500 font-bold mt-1">Estimated Ad Revenue (This Month)</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
        <p className="text-sm font-extrabold text-blue-800">Google AdSense is Active</p>
        <p className="text-xs text-blue-600 mt-1">Ads are automatically placed in your articles. You earn a share of the revenue based on your traffic.</p>
      </div>
    </div>
  );
}