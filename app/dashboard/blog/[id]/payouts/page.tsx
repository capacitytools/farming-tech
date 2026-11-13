export default function PayoutSettingsPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-extrabold text-forest-800">🏦 Payout Settings</h1>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <p className="text-sm font-bold text-gray-700">Bank Account Details</p>
        <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Bank Name" />
        <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Account Number" />
        <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Account Name" />
        <button className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm mt-2 opacity-50 cursor-not-allowed">Save (Pending Verification)</button>
      </div>
    </div>
  );
}