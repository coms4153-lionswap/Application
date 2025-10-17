import { Link } from "react-router-dom";

export default function Items() {
  return (
    <section className="max-w-3xl mx-auto p-8">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Item Listing</h2>
      </header>

      <p className="text-gray-600 mb-6">
        Browse items here.
      </p>

      <div className="mt-6 text-center">
        <Link to="/" className="text-blue-500 underline">← Back home</Link>
      </div>
    </section>
  );
}
