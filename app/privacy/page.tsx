export const metadata = {
  title: 'Privacy Policy | Farming Tech & Business',
  description: 'Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-forest-950 pb-24">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">Privacy Policy</h1>
        <p className="text-xs text-forest-100 mt-1">Last Updated: November 2026</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
        
        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, subscribe to our newsletter, post on the Timeline, or use our AI tools. This includes your name, email address, WhatsApp number, and profile information.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">2. How We Use Your Data</h2>
          <p>Your data helps us operate the platform, personalize your experience, improve our AI models (anonymized), and send you relevant agricultural content. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">3. Cookies & Third-Party Advertising</h2>
          <p>We use cookies to keep you logged in, remember your preferences, and analyze site traffic. </p>
          <p className="mt-2"><strong>Google AdSense:</strong> We use third-party advertising companies, including Google, to serve ads when you visit our website. These companies may use information (not including your name, address, email address, or telephone number) about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
          <p className="mt-2">Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our sites and/or other sites on the Internet. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">Google Ads Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">www.aboutads.info</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">4. AI Tools & Data</h2>
          <p>When you use our AI Agri-Doctor or other AI tools, the images and text you submit may be processed by third-party AI providers (like Google Gemini). We do not permanently store these images for training our own models without your explicit consent.</p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">5. Your Rights</h2>
          <p>You have the right to request access to, correction of, or deletion of your personal data. You can contact us at any time to exercise these rights via our Contact page.</p>
        </section>

      </div>
    </div>
  );
}