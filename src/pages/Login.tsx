
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_CONFIG } from "../config";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [uni, setUni] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        // Create new account
        const response = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uni: uni.trim(),
            student_name: name.trim(),
            email: email.trim(),
            dept_name: "General",
            credibility_score: 100
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Registration failed:", response.status, errorData);
          throw new Error(errorData.detail || "Failed to create account. UNI may already exist.");
        }
      } else {
        // Login - verify user exists
        const response = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/${uni.trim()}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Account not found. Please create an account first.");
          }
          throw new Error("Failed to verify account");
        }
      }

      // Set the session and navigate to profile
      localStorage.setItem("user_uni", uni.trim());
      navigate("/profile");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        setError("Unable to connect to the server. Please check your internet connection or try again later.");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="max-w-sm w-full text-center">
        <h2 className="text-3xl font-bold mb-2 text-black tracking-tight">
          {isRegistering ? "Create Account" : "Welcome back"}
        </h2>
        <p className="text-gray-500 mb-10">
          {isRegistering ? "Join the LionSwap community" : "Sign in to your LionSwap account"}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <input 
            type="text" 
            placeholder="UNI (e.g., ab1234)" 
            className="input-field"
            value={uni}
            onChange={(e) => setUni(e.target.value)}
            required
          />
          
          {isRegistering && (
            <>
              <input 
                type="text" 
                placeholder="Full Name" 
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input 
                type="email" 
                placeholder="Columbia Email" 
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-3"
          >
            {loading ? "Processing..." : (isRegistering ? "Create Account" : "Continue")}
          </button>
        </form>
        
        <button 
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
          }}
          className="text-sm text-gray-500 hover:text-black underline mb-6"
        >
          {isRegistering ? "Already have an account? Log in" : "New to LionSwap? Create an account"}
        </button>
        
        <p className="text-xs text-gray-400 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          <br />
          Only Columbia University (.edu) accounts are supported.
        </p>

        <div className="mt-12">
          <Link to="/" className="text-gray-400 hover:text-black text-sm transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
