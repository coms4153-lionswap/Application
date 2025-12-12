import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_CONFIG } from "./config";

export default function App() {
  const navigate = useNavigate();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    const processOAuthCallback = async () => {
      let hash = window.location.hash.substring(1);
      
      // Handle double hash (##) from backend redirect
      if (hash.startsWith('#')) {
        hash = hash.substring(1);
      }
      
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get('access_token');
      const email = params.get('email');
      const userId = params.get('user_id');
      
      if (accessToken && email) {
        setIsProcessingAuth(true);
        
        try {
          localStorage.setItem('google_access_token', accessToken);
          localStorage.setItem('user_email', email);
          
          // Get JWT from security service
          try {
            const jwtResponse = await fetch(`${API_CONFIG.SECURITY_SERVICE_URL}/security/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ google_access_token: accessToken })
            });
            
            if (jwtResponse.ok) {
              const jwtData = await jwtResponse.json();
              if (jwtData.app_jwt) {
                localStorage.setItem('app_jwt', jwtData.app_jwt);
              }
            }
          } catch (jwtErr) {
            console.warn('Could not fetch JWT from security service:', jwtErr);
          }
          
          if (userId) {
            const userResponse = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/by-id/${userId}`);
            const userData = await userResponse.json();
            
            if (userData.uni) {
              localStorage.setItem('user_uni', userData.uni);
              localStorage.setItem('user_id', userId);
              
              window.location.hash = '';
              navigate('/profile');
              return;
            }
          }
          
          const userByEmailResponse = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/by-email/${encodeURIComponent(email)}`);
          const userByEmailData = await userByEmailResponse.json();
          
          if (userByEmailData.user_id) {
            const userResponse = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/by-id/${userByEmailData.user_id}`);
            const userData = await userResponse.json();
            
            if (userData.uni) {
              localStorage.setItem('user_uni', userData.uni);
              localStorage.setItem('user_id', userByEmailData.user_id.toString());
              
              window.location.hash = '';
              navigate('/profile');
              return;
            }
          }
          
          window.location.hash = '';
        } catch (err) {
          console.error('Error processing OAuth:', err);
          window.location.hash = '';
        } finally {
          setIsProcessingAuth(false);
        }
      }
    };
    
    processOAuthCallback();
  }, [navigate]);

  if (isProcessingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Processing login...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">LionSwap</h1>
          <p className="text-sm text-gray-600">Trade your items here!</p>
        </div>

        <nav className="flex items-center space-x-4">
          <Link to="/login" className="text-blue-500 underline text-sm whitespace-nowrap">
            User Login
          </Link>
          <Link to="/profile" className="text-blue-500 underline text-sm whitespace-nowrap">
            Profile
          </Link>
          <Link to="/items" className="text-blue-500 underline text-sm whitespace-nowrap">
            Item Listing
          </Link>
          <Link to="/reservations" className="text-blue-500 underline text-sm whitespace-nowrap">
            Reservations
          </Link>
          <Link to="/conversations" className="text-blue-500 underline text-sm whitespace-nowrap">
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
