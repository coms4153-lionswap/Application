import { Link } from "react-router-dom";

export default function Login() {
  return (
    <section className="max-w-xl mx-auto p-8">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">User Login</h2>
      </header>

      <p className="text-gray-600 mb-6">
        Please Enter your credentials to sign in.
      </p>

      <form className="max-w-sm mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" />
        </div>
        <div className="text-center">
          <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded">
            Sign in
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <Link to="/" className="text-blue-500 underline">← Back home</Link>
      </div>
    </section>
  );
}
