export default function AboutPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="glass-card p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">About Farming Tech & Business</h1>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Welcome to the ultimate hub for African farmers. We combine modern technology 
          with traditional farming wisdom to help you grow better, earn more, and build 
          a sustainable future.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Our platform offers AI-powered crop and livestock diagnostics, a thriving 
          marketplace for buying and selling, and dedicated community tribes where farmers 
          share daily insights and support each other.
        </p>
        <h2 className="text-xl font-bold mt-6 mb-3 text-green-700">Our Mission</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Empower smallholder farmers with AI and data.</li>
          <li>Connect sellers directly to buyers, reducing middlemen.</li>
          <li>Provide a safe community space for learning and networking.</li>
        </ul>
      </div>
    </div>
  );
}