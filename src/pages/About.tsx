import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="max-w-xl mx-auto p-8 text-center">
      <h2 className="text-2xl font-semibold mb-4">About Page</h2>

      <p className="text-gray-600 mb-6">
        This is a placehholder application for LionSwap.
      </p>
      
      <Link to="/" className="text-blue-500 underline">
        ← Back home
      </Link>
    </section>
  );
}
