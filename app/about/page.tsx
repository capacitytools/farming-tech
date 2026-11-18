export const metadata = {
  title: 'About Us | Farming Tech & Business',
  description: 'Learn about our mission to empower Nigerian farmers with modern technology and practical agricultural knowledge.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-forest-950 pb-24">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">About Us</h1>
        <p className="text-xs text-forest-100 mt-1">Empowering the modern farmer.</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6 text-gray-800 dark:text-gray-200">
        
        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">🌾 Our Mission</h2>
          <p className="leading-relaxed">Farming Tech & Business is a digital operating system for the modern African farmer. We exist to bridge the gap between traditional agricultural wisdom and modern technology. Our goal is to help farmers, agribusiness owners, and agricultural enthusiasts succeed through accessible knowledge, AI-driven tools, and a thriving community.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">🚀 What We Offer</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong>Practical Guides:</strong> Deep-dive articles on poultry, rabbit farming, livestock, crops, and agribusiness.</li>
            <li><strong>AI Agri-Doctor:</strong> Use your camera to get instant diagnostic suggestions for plant and animal diseases.</li>
            <li><strong>Marketplace:</strong> A platform to buy and sell livestock and farm produce directly.</li>
            <li><strong>Community:</strong> Join Tribes to connect with other farmers facing similar challenges.</li>
            <li><strong>E-books:</strong> Digital products to help you scale your farming business.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">👨🏾‍🌾 Who is Behind This?</h2>
          <p className="leading-relaxed">This platform is built and managed by a team of agricultural enthusiasts and software developers dedicated to solving real problems in the African agricultural sector. We believe that access to the right information and tools is the fastest way to increase food security and farm profitability.</p>
        </section>

      </div>
    </div>
  );
}