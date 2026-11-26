import Image from 'next/image';

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

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-gray-800 dark:text-gray-200">
        
        {/* 🚨 SECTION 1: MEET THE FOUNDER 🚨 */}
        <section className="bg-white dark:bg-forest-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-forest-800">
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-4">👨🏾‍🌾 Meet the Founder</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            {/* 🚨 YOUR PHOTO IS NOW LIVE HERE 🚨 */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-forest-200 bg-gray-200 flex-shrink-0 relative">
              <img 
                src="https://res.cloudinary.com/jnvtguiz/image/upload/v1795706457/1795692376845.jpg" 
                alt="Akinsuroju Olubunmi" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-extrabold text-forest-900 dark:text-white">Akinsuroju Olubunmi</h3>
              <p className="text-xs font-bold text-forest-600 uppercase tracking-wider mb-2">Founder & Lead Agricultural Consultant</p>
              
              <p className="text-sm leading-relaxed">
                With a background in Biochemistry and over a decade of practical experience in Nigerian agriculture, 
                I built Farming Tech & Business to bridge the gap between scientific farming methods and everyday 
                farm realities. Having personally managed poultry and rabbit operations, I know the daily challenges 
                farmers face—from feed costs to disease outbreaks.
              </p>
              <p className="text-sm leading-relaxed mt-2">
                Every article on this platform is reviewed by me or my team before publication to ensure it is 
                practical, safe, and relevant to the Nigerian climate.
              </p>
            </div>
          </div>
        </section>

        {/* 🚨 SECTION 2: OUR MISSION 🚨 */}
        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">🌾 Our Mission</h2>
          <p className="leading-relaxed">
            Farming Tech & Business is a digital operating system for the modern African farmer. We exist to bridge the gap between traditional agricultural wisdom and modern technology. Our goal is to help farmers, agribusiness owners, and agricultural enthusiasts succeed through accessible knowledge, AI-driven tools, and a thriving community.
          </p>
        </section>
        
        {/* 🚨 SECTION 3: WHAT WE OFFER 🚨 */}
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

        {/* 🚨 SECTION 4: OUR COMMITMENT TO QUALITY 🚨 */}
        <section>
          <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300 mb-2">📝 Our Commitment to Quality</h2>
          <p className="leading-relaxed">
            We take agricultural education seriously. Our content is researched using credible sources, practical 
            field experience, and is updated regularly. We do not publish content on veterinary medications or 
            chemical applications without recommending professional consultation.
          </p>
        </section>

      </div>
    </div>
  );
}