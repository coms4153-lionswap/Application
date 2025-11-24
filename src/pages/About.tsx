import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <h2 className="text-3xl font-bold mb-6 text-black">About LionSwap</h2>
        <p className="text-gray-500 mb-10 leading-relaxed">
          LionSwap is the exclusive marketplace for the Columbia University community.
          Built by students, for students.
        </p>
        
        <Link to="/" className="btn-secondary inline-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
