export const metadata = {
  title: 'Editorial Policy | Farming Tech & Business',
  description: 'Our commitment to accurate, transparent, and trustworthy agricultural publishing.',
};

export default function EditorialPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-forest-950 pb-24">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">Editorial Policy</h1>
        <p className="text-xs text-forest-100 mt-1">Our commitment to accuracy.</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">Our Commitment to Accuracy</h2>
        <p>Farming Tech & Business is dedicated to providing accurate, practical, and actionable agricultural knowledge. Our editorial process is designed to ensure that every article published on this site is reliable.</p>

        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">AI-Assisted Content</h2>
        <p>We use advanced AI models to assist in drafting and structuring content. However, <strong>all AI-generated content is reviewed, fact-checked, and edited by our human editorial team</strong> before publication. We believe in the power of AI to scale knowledge, but human oversight is non-negotiable.</p>

        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">Sourcing & References</h2>
        <p>Where possible, our articles reference credible sources such as agricultural research papers, government extension agencies, and recognized industry experts.</p>

        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">Corrections Policy</h2>
        <p>We are committed to transparency. If we discover an error in an article, we will correct it promptly and note the correction. If you spot an error, please contact us immediately.</p>

        <h2 className="text-xl font-extrabold text-forest-800 dark:text-forest-300">Advertising & Independence</h2>
        <p>We may display advertisements (like Google AdSense) or affiliate links. These do not influence our editorial content. We only recommend products or services we believe will add value to our readers.</p>
      </div>
    </div>
  );
}