export default function EbooksPage() {
  const ebooks = [
    { title: "The Ultimate Guide to Rabbit Farming", price: "₦5,000", image: "🐰" },
    { title: "Poultry Diseases & Prevention", price: "₦3,500", image: "🐔" },
    { title: "Fish Farming for Beginners", price: "₦4,000", image: "🐟" },
    { title: "Profitable Pig Farming", price: "₦6,000", image: "🐖" }
  ];

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📚 E-Book Store</h1>
      <p className="text-gray-600 mb-8">Download premium farming guides to boost your yield and profits.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ebooks.map((book, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl shadow-lg flex flex-col items-center text-center">
            <div className="text-6xl mb-4">{book.image}</div>
            <h2 className="font-bold text-lg mb-2">{book.title}</h2>
            <p className="text-green-700 font-bold text-xl mb-4">{book.price}</p>
            <button className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition">
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}