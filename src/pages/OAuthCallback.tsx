import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthCallback() {
  const [status, setStatus] = useState("Processing authentication...");
  const [debugInfo, setDebugInfo] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const processOAuthResponse = async () => {
      try {
        // Method 1: Check if tokens are passed as query parameters (preferred backend flow)
        const tokenFromQuery = searchParams.get('token') || searchParams.get('access_token');
        const emailFromQuery = searchParams.get('email');
        const userIdFromQuery = searchParams.get('user_id');
        
        if (tokenFromQuery) {
          console.log("✓ Found token in query params");
          localStorage.setItem('google_access_token', tokenFromQuery);
          if (emailFromQuery) localStorage.setItem('user_email', emailFromQuery);
          if (userIdFromQuery) localStorage.setItem('user_id', userIdFromQuery);
          
          setStatus("Authentication successful! Redirecting...");
          setTimeout(() => navigate('/items'), 500);
          return;
        }

        // Method 2: Check for error in query params
        const error = searchParams.get('error');
        if (error) {
          console.error("OAuth error from backend:", error);
          setStatus(`Authentication failed: ${error}`);
          setDebugInfo(`Error: ${error}, Description: ${searchParams.get('error_description')}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Method 3: Try to extract JSON from the page body (current backend behavior)
        const pageContent = document.body.innerText;
        console.log("Page content length:", pageContent.length);
        console.log("Page content preview:", pageContent.substring(0, 500));
        
        // Try to parse the entire page content as JSON
        let data;
        try {
          data = JSON.parse(pageContent);
          console.log("✓ Successfully parsed page as JSON");
        } catch (parseErr) {
          // If direct parse fails, try to find JSON embedded in HTML
          console.log("Direct parse failed, searching for JSON in HTML...");
          const jsonMatch = pageContent.match(/\{[^{}]*"access_token"[^{}]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
            console.log("✓ Found JSON embedded in HTML");
          } else {
            throw new Error("No JSON found in response. Backend may have returned an HTML page or error.");
          }
        }
        
        if (data && data.access_token && data.email) {
          console.log("✓ Valid OAuth data found:", { email: data.email, hasToken: !!data.access_token });
          
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
          console.error("Invalid data structure:", data);
          setStatus("Invalid authentication response. Please try again.");
          setDebugInfo(`Received data but missing required fields. Has access_token: ${!!data?.access_token}, Has email: ${!!data?.email}`);
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        console.error("Error details:", {
          message: err.message,
          url: window.location.href,
          pageLength: document.body.innerText.length
        });
        
        setStatus("Authentication failed. Please try again from the login page.");
        setDebugInfo(`Error: ${err.message}. The backend may not be returning the expected JSON response. Check console for details.`);
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    processOAuthResponse();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="max-w-lg w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600 mb-4">{status}</p>
        {debugInfo && (
          <details className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
            <summary className="cursor-pointer font-semibold mb-2">Debug Information</summary>
            <pre className="whitespace-pre-wrap break-words">{debugInfo}</pre>
            <p className="mt-2 text-gray-600">
              Check the browser console (F12) for more details.
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
