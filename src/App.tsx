import { useState } from "react";
import { Link } from "react-router-dom";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <main className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">LionSwap</h1>
      <p className="mb-4 text-gray-600">
        Trade your items here!
      </p>
      <div className="mt-6">
        <Link to="/about" className="text-blue-500 underline">
          Go to About →
        </Link>
      </div>
    </main>
  );
}
