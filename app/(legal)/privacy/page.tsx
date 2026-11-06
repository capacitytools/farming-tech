export const metadata = {
  title: 'Privacy Policy | Farming Tech & Business',
  description: 'Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500 italic">Last Updated: October 2026</p>
      
      <h2 className="text-xl font-extrabold text-forest-800">1. Information We Collect</h2>
      <p>We collect information you provide directly to us when you create an account, subscribe to our newsletter, or use our AI tools. This includes your name, email address, and profile information.</p>

      <h2 className="text-xl font-extrabold text-forest-800">2. How We Use Your Data</h2>
      <p>Your data helps us operate the platform, personalize your experience, improve our AI models (anonymized), and send you relevant agricultural content. We do not sell your personal data to third parties.</p>

      <h2 className="text-xl font-extrabold text-forest-800">3. Cookies & Tracking</h2>
      <p>We use cookies to keep you logged in, remember your preferences, and analyze site traffic. We may also use third-party advertising partners (like Google AdSense) who may use cookies to serve ads based on your prior visits to our website.</p>

      <h2 className="text-xl font-extrabold text-forest-800">4. AI Tools & Data</h2>
      <p>When you use our AI Agri-Doctor or other AI tools, the images and text you submit may be processed by third-party AI providers (like Google Gemini). We do not permanently store these images for training our own models without your explicit consent.</p>

      <h2 className="text-xl font-extrabold text-forest-800">5. Your Rights</h2>
      <p>You have the right to request access to, correction of, or deletion of your personal data. You can contact us at any time to exercise these rights.</p>
    </div>
  );
}