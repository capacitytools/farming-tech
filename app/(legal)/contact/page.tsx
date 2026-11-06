export const metadata = {
  title: 'Contact Us | Farming Tech & Business',
  description: 'Get in touch with the Farming Tech & Business team for support, partnerships, or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-forest-800">📬 Get in Touch</h2>
      <p>
        We love hearing from our community! Whether you have a question about farming, need support with the platform, or want to explore partnership opportunities, our team is here to help.
      </p>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <p className="font-bold text-forest-800 mb-1">Email Support</p>
        <p className="text-sm">For general inquiries and support, email us at:<br/>
        <strong className="text-green-700">support@farmingtechbusiness.com</strong></p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <p className="font-bold text-forest-800 mb-1">Business & Partnerships</p>
        <p className="text-sm">For advertising, sponsored posts, or partnerships:<br/>
        <strong className="text-green-700">partnerships@farmingtechbusiness.com</strong></p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <p className="font-bold text-forest-800 mb-1">Report an Issue</p>
        <p className="text-sm">
          If you spot a broken link, an inaccurate article, or a technical glitch, please let us know via email so we can fix it immediately.
        </p>
      </div>
    </div>
  );
}