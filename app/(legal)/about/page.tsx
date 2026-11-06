export const metadata = {
  title: 'About Us | Farming Tech & Business',
  description: 'Learn about our mission to empower Nigerian farmers with modern technology, practical agricultural knowledge, and business tools.',
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-forest-800">🌾 Our Mission</h2>
      <p>
        Farming Tech & Business is a digital operating system for the modern farmer. We exist to bridge the gap between traditional agricultural wisdom and modern technology. Our goal is to help farmers, agribusiness owners, and agricultural enthusiasts succeed through accessible knowledge, AI-driven tools, and a thriving community.
      </p>
      
      <h2 className="text-xl font-extrabold text-forest-800">🚀 What We Offer</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Practical Guides:</strong> Step-by-step articles on poultry, rabbit farming, livestock, crops, and more.</li>
        <li><strong>AI Agri-Doctor:</strong> Use your camera to diagnose plant and animal diseases instantly.</li>
        <li><strong>Marketplace:</strong> A trusted platform to buy and sell livestock and farm produce.</li>
        <li><strong>Community:</strong> Join Tribes to connect with other farmers facing similar challenges.</li>
        <li><strong>E-books:</strong> Deep-dive digital products to help you scale your farming business.</li>
      </ul>

      <h2 className="text-xl font-extrabold text-forest-800">🌍 Our Vision</h2>
      <p>
        We envision a future where every farmer in Africa has the knowledge, tools, and market access to build a profitable and sustainable agricultural business. By making agricultural information accessible and affordable, we are empowering the next generation of agripreneurs.
      </p>
    </div>
  );
}