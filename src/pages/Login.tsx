
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_CONFIG } from "../config";

// JWT generation function (matching backend SECRET_KEY)
const generateJWTToken = async (userId: number, role: string = "user"): Promise<string> => {
  const SECRET_KEY = "LION_SWAP_GOAT_IS_THE_KEY";
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 hours
  
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    user_id: userId,
    role: role,
    iat: now,
    exp: exp
  };
  
  const base64UrlEncode = (obj: any) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  
  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const data = `${headerEncoded}.${payloadEncoded}`;
  
  // HMAC-SHA256 signing
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  const messageData = encoder.encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${data}.${signatureEncoded}`;
};

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [uni, setUni] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Redirect to profile if already logged in
  useEffect(() => {
    const token = localStorage.getItem('app_jwt');
    const userId = localStorage.getItem('user_id');
    if (token || userId) {
      navigate('/profile');
    }
  }, [navigate]);

  // Handle OAuth callback - the backend shows JSON, so user needs to copy it here
  const [showOAuthPaste, setShowOAuthPaste] = useState(false);
  const [oauthJson, setOauthJson] = useState("");

  const handleOAuthJson = async () => {
    try {
      const data = JSON.parse(oauthJson);
      
      if (data.access_token && data.email) {
        // Store the Google OAuth tokens
        localStorage.setItem('google_access_token', data.access_token);
        localStorage.setItem('google_id_token', data.id_token || '');
        localStorage.setItem('user_email', data.email);
        localStorage.setItem('user_id', data.user_id?.toString() || '');
        
        // Fetch user profile to get UNI
        try {
          const userResponse = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users?user_id=${data.user_id}`);
          if (userResponse.ok) {
            const users = await userResponse.json();
            if (users && users.length > 0) {
              localStorage.setItem('user_uni', users[0].uni);
            }
          }
        } catch (err) {
          console.warn("Failed to fetch user profile:", err);
        }
        
        // Now exchange the Google access_token for a JWT from our Identity service
        // According to the message, we need to pass access_token to JWT service
        try {
          const jwtResponse = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/auth/verify-jwt`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${data.access_token}`
            },
            body: JSON.stringify({ token: data.access_token })
          });

          if (jwtResponse.ok) {
            const jwtData = await jwtResponse.json();
            localStorage.setItem('jwt_token', jwtData.token || jwtData.access_token);
          }
        } catch (err) {
          console.warn("JWT exchange failed, using Google token directly:", err);
        }
        
        setError('');
        setShowOAuthPaste(false);
        navigate('/items');
      } else {
        setError("Invalid OAuth response format");
      }
    } catch (err) {
      setError("Failed to parse OAuth response. Please paste valid JSON.");
    }
  };
  
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
        
        // After registration, fetch user data and generate JWT
        const userData = await response.json();
        const userId = userData.user_id;
        const role = userId === 11 ? "admin" : "user";
        
        // Store user data
        localStorage.setItem("user_id", userId.toString());
        localStorage.setItem("user_email", userData.email || email.trim());
        
        // Generate JWT token
        const jwt = await generateJWTToken(userId, role);
        localStorage.setItem("app_jwt", jwt);
      } else {
        // Login - verify user exists
        const response = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/${uni.trim()}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Account not found. Please create an account first.");
          }
          throw new Error("Failed to verify account");
        }
        
        const userData = await response.json();
        const userId = userData.user_id;
        const role = userId === 11 ? "admin" : "user";
        
        // Store user data
        localStorage.setItem("user_id", userId.toString());
        localStorage.setItem("user_email", userData.email || `${uni.trim()}@columbia.edu`);
        
        // Generate JWT token
        const jwt = await generateJWTToken(userId, role);
        localStorage.setItem("app_jwt", jwt);
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

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>

        {!showOAuthPaste ? (
          <>
            <a
              href={`${API_CONFIG.IDENTITY_SERVICE_URL}/auth/google/login`}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>
            
            <button
              onClick={() => setShowOAuthPaste(true)}
              className="w-full text-xs text-gray-500 hover:text-gray-700 mb-4"
            >
              Already logged in with Google? Paste response here
            </button>
          </>
        ) : (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-gray-600">
              After logging in with Google, copy the entire JSON response and paste it below:
            </p>
            <textarea
              placeholder='{"access_token":"...","id_token":"...","email":"...","user_id":...}'
              className="w-full p-3 border border-gray-300 rounded-lg text-xs font-mono"
              rows={6}
              value={oauthJson}
              onChange={(e) => setOauthJson(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleOAuthJson}
                className="flex-1 btn-primary"
              >
                Complete Login
              </button>
              <button
                onClick={() => {
                  setShowOAuthPaste(false);
                  setOauthJson("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
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
