export const metadata = {
  title: 'Disclaimer | Farming Tech & Business',
  description: 'Important disclaimers regarding agricultural advice and AI tools on our platform.',
};

export default function DisclaimerPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-forest-800">1. Educational Purposes Only</h2>
      <p>The content on Farming Tech & Business is for general informational and educational purposes only. While we strive for accuracy, agriculture is a complex field with many variables (climate, soil, animal health).</p>

      <h2 className="text-xl font-extrabold text-forest-800">2. Not Professional Advice</h2>
      <p><strong>Agricultural & Veterinary Advice:</strong> Our articles and AI tools do not constitute professional veterinary or agronomic advice. Always consult a licensed veterinarian or agricultural extension officer before applying treatments, chemicals, or major farming decisions.</p>
      <p><strong>Financial Advice:</strong> Articles about farm business, profits, and costs are estimates. We do not guarantee any financial results.</p>

      <h2 className="text-xl font-extrabold text-forest-800">3. AI Limitations</h2>
      <p>Our AI Agri-Doctor uses machine learning to suggest potential diagnoses. AI can make mistakes. It is a tool for observation, not a replacement for physical examination by an expert.</p>

      <h2 className="text-xl font-extrabold text-forest-800">4. External Links</h2>
      <p>We may link to external websites. We are not responsible for the content or accuracy of those external sites.</p>
    </div>
  );
}