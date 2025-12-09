import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const [status, setStatus] = useState("Processing authentication...");
  const navigate = useNavigate();

  useEffect(() => {
    const processOAuthResponse = async () => {
      try {
        // The page content should be the JSON response from the Identity service
        // We need to extract it from the page
        const pageContent = document.body.innerText;
        
        // Try to parse the entire page content as JSON
        const data = JSON.parse(pageContent);
        
        if (data.access_token && data.email) {
          // Store the Google OAuth tokens
          localStorage.setItem('google_access_token', data.access_token);
          localStorage.setItem('google_id_token', data.id_token || '');
          localStorage.setItem('user_email', data.email);
          localStorage.setItem('user_id', data.user_id?.toString() || '');
          
          setStatus("Authentication successful! Redirecting...");
          
          // Redirect to items page
          setTimeout(() => {
            navigate('/items');
          }, 500);
        } else {
          setStatus("Invalid authentication response. Please try again.");
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        setStatus("Authentication failed. Redirecting to login...");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    processOAuthResponse();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="max-w-sm w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
