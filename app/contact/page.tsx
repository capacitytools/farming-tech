export default function ContactPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
        <p className="text-gray-700 text-center mb-8">
          Have questions, feedback, or partnership ideas or will love to be connected to an expert? We'd love to hear from you.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-white/60 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📧</span>
              <p className="font-semibold">Email Support</p>
            </div>
            <div className="pl-10 text-sm text-gray-600 space-y-1">
              <a href="mailto:akinsuroju.olubunmi@gmail.com" className="hover:underline">akinsuroju.olubunmi@gmail.com</a><br />
              <a href="mailto:support@farmingtech.com" className="hover:underline">support@farmingtech.com</a>
            </div>
          </div>
          
          <div className="p-4 bg-white/60 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📞</span>
              <p className="font-semibold">Phone / WhatsApp</p>
            </div>
            <div className="pl-10 text-sm text-gray-600 space-y-1">
              <a href="https://wa.me/2347033143508" target="_blank" rel="noopener noreferrer" className="hover:underline">+234 7033143508</a><br />
              <a href="https://wa.me/2349159884244" target="_blank" rel="noopener noreferrer" className="hover:underline">+234 9159884244</a>
            </div>
          </div>
          
          <div className="p-4 bg-white/60 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📍</span>
              <p className="font-semibold">Headquarters</p>
            </div>
            <div className="pl-10 text-sm text-gray-600 space-y-1">
              <p>Akure, Nigeria</p>
              <p>Branch: Lagos, Nigeria</p>
              <p>Branch: Ile-Oluji, Nigeria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}