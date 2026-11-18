export const metadata = {
  title: 'Contact Us | Farming Tech & Business',
  description: 'Get in touch with the Farming Tech & Business team for support, partnerships, or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-forest-950 pb-24">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">Contact Us</h1>
        <p className="text-xs text-forest-100 mt-1">We'd love to hear from you.</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-4 text-gray-800 dark:text-gray-200">
        <p className="leading-relaxed">
          Whether you have a question about farming, need support with the platform, or want to explore partnership opportunities, our team is here to help.
        </p>

        <div className="glass-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-forest-800 bg-white dark:bg-forest-900">
          <p className="font-bold text-forest-800 dark:text-white mb-1">General & Business Inquiries</p>
          <p className="text-sm">For general questions, partnerships, or advertising:<br/>
          <strong className="text-green-700 dark:text-green-400">hello@farmingtechbusiness.com</strong></p>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-forest-800 bg-white dark:bg-forest-900">
          <p className="font-bold text-forest-800 dark:text-white mb-1">Technical Support</p>
          <p className="text-sm">If you need help with your account or the AI Agri-Doctor:<br/>
          <strong className="text-green-700 dark:text-green-400">support@farmingtechbusiness.com</strong></p>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-sm border border-forest-200 dark:border-forest-800 bg-forest-50 dark:bg-forest-900">
          <p className="font-bold text-forest-800 dark:text-white mb-1">Direct WhatsApp Chat</p>
          <p className="text-sm">Click the button below to chat with us immediately:<br/>
          <a href="https://wa.me/2349159884244" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">
            📲 Chat on WhatsApp
          </a></p>
        </div>
      </div>
    </div>
  );
}