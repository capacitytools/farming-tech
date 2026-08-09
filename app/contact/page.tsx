export default function ContactPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
        <p className="text-gray-700 text-center mb-8">
          Have questions, feedback, or partnership ideas? We'd love to hear from you.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-semibold">Email Support</p>
              <p className="text-sm text-gray-600">support@farmingtech.com</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl">
            <span className="text-2xl">📞</span>
            <div>
              <p className="font-semibold">Phone / WhatsApp</p>
              <p className="text-sm text-gray-600">+234 800 000 0000</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-semibold">Headquarters</p>
              <p className="text-sm text-gray-600">Lagos, Nigeria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}