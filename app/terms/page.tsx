export const metadata = {
  title: 'Terms & Conditions | Farming Tech & Business',
  description: 'Read the terms and conditions for using the Farming Tech & Business platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-forest-950 pb-24">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">Terms & Conditions</h1>
        <p className="text-xs text-forest-100 mt-1">Last Updated: November 2026</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
        
        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using Farming Tech & Business ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">2. Use of the Platform</h2>
          <p>You agree to use the Platform for lawful purposes only. You are strictly prohibited from:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Posting spam, hate speech, or harmful content.</li>
            <li>Impersonating other users or providing false information.</li>
            <li>Attempting to hack, scrape, or disrupt the Platform's servers or AI tools.</li>
          </ul>
          <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these rules without prior notice.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">3. Marketplace Disclaimer</h2>
          <p>Farming Tech & Business provides a platform for farmers and buyers to connect. <strong>We do not own, inspect, or guarantee the quality of the livestock, crops, or produce listed on the Marketplace.</strong> All transactions are strictly between the buyer and the seller. We are not responsible for scams, delivery issues, or disputes arising from these transactions.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">4. E-books and Digital Products</h2>
          <p>All digital products, including e-books, are non-refundable once accessed or downloaded. They are for personal educational use only and may not be resold or redistributed.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">5. AI Tools Limitation</h2>
          <p>Our AI tools (including the AI Agri-Doctor) are provided "as is" and are for informational and diagnostic assistance purposes only. They do not replace professional veterinary or agronomic advice. Always consult a licensed expert before applying treatments.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">6. Intellectual Property</h2>
          <p>All original content, logos, software, and AI systems on this platform are the property of Farming Tech & Business. You may not copy, reproduce, or distribute our proprietary content without written permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">7. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. Your continued use of the Platform after changes are posted constitutes your acceptance of the new Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">8. Contact</h2>
          <p>If you have any questions about these Terms, please contact us at <strong>hello@farmingtechbusiness.com</strong>.</p>
        </section>

      </div>
    </div>
  );
}