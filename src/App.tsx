import { useState } from "react";
import { Link } from "react-router-dom";

export default function App() {
  return (
    <main className="max-w-xl mx-auto p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">LionSwap</h1>
          <p className="text-sm text-gray-600">Trade your items here!</p>
        </div>

        <nav className="space-x-4">
          <Link to="/login" className="text-blue-500 underline text-sm">
            User Login
          </Link>
          <Link to="/items" className="text-blue-500 underline text-sm">
            Item Listing
          </Link>
          <Link to="/reservations" className="text-blue-500 underline text-sm">
            Reservations
          </Link>
          <Link to="/conversations" className="text-blue-500 underline text-sm">
            Messages
          </Link>
        </nav>
      </header>

      <section className="text-center mt-8">
        <p className="mb-4 text-gray-600">Welcome! Browse items or sign in to manage your listings.</p>
        <div className="mt-6">
          <Link to="/about" className="text-blue-500 underline">
            Go to About →
          </Link>
        </div>
      </section>
    </main>
  );
}
