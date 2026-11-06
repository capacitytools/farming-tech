export const metadata = {
  title: 'Disclaimer | Farming Tech & Business',
  description: 'Important disclaimers regarding agricultural advice and AI tools on our platform.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-forest-950 pb-24">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">Disclaimer</h1>
        <p className="text-xs text-forest-100 mt-1">Important information about our content.</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">1. Educational Purposes Only</h2>
        <p>The content on Farming Tech & Business is for general informational and educational purposes only. While we strive for accuracy, agriculture is a complex field with many variables (climate, soil, animal health).</p>

        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">2. Not Professional Advice</h2>
        <p><strong>Agricultural & Veterinary Advice:</strong> Our articles and AI tools do not constitute professional veterinary or agronomic advice. Always consult a licensed veterinarian or agricultural extension officer before applying treatments, chemicals, or major farming decisions.</p>
        <p><strong>Financial Advice:</strong> Articles about farm business, profits, and costs are estimates. We do not guarantee any financial results.</p>

        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">3. AI Limitations</h2>
        <p>Our AI Agri-Doctor uses machine learning to suggest potential diagnoses. AI can make mistakes. It is a tool for observation, not a replacement for physical examination by an expert.</p>

        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">4. External Links</h2>
        <p>We may link to external websites. We are not responsible for the content or accuracy of those external sites.</p>
      </div>
    </div>
  );
}