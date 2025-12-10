# Google OAuth Login Issues - Diagnosis & Fixes

## Problem Summary
Google OAuth login is not working because the backend Identity service returns an HTML page instead of redirecting to the frontend with tokens or returning machine-readable JSON.

## Root Causes (verified via gcloud logs)

### 1. Backend doesn't redirect to frontend
- Current flow: User clicks "Continue with Google" → Google OAuth → Backend `/auth/google/callback` → Backend returns response on its own domain
- Expected flow: Should redirect back to frontend (e.g., `https://your-frontend/oauth/callback?token=...`)

### 2. Backend returns HTML page, not JSON
- The `OAuthCallback.tsx` component expects raw JSON in the page body
- Backend is likely returning an HTML page (possibly with JSON embedded)
- Cloud Run logs show successful callbacks return `200 OK` but frontend can't parse the response

### 3. CSRF/Session issues (intermittent)
- Logs show `MismatchingStateError: CSRF Warning! State not equal in request and response`
- Likely cause: Cloud Run instances restart, or session cookies aren't maintained across redirects
- This causes some OAuth flows to fail with `400 Bad Request`

## Frontend Fixes Applied ✓

Updated `src/pages/OAuthCallback.tsx` to:
- ✅ Accept tokens via query parameters (`?token=...&email=...`)
- ✅ Try to parse page body as JSON
- ✅ Extract JSON from HTML if embedded (regex fallback)
- ✅ Add detailed console logging
- ✅ Display debug info to users
- ✅ Handle error query params (`?error=...`)

## Backend Fixes Needed (Identity Service)

The backend `/auth/google/callback` endpoint should do ONE of the following:

### Option 1: Redirect to frontend with token (recommended)
```python
# After successful OAuth exchange
return RedirectResponse(
    url=f"https://your-frontend-domain/oauth/callback?token={access_token}&email={user_email}&user_id={user_id}"
)
```

### Option 2: Return JSON with appropriate Content-Type
```python
return JSONResponse({
    "access_token": token["access_token"],
    "id_token": token.get("id_token"),
    "email": user_info["email"],
    "user_id": user.id
}, headers={"Content-Type": "application/json"})
```

### Option 3: Set secure cookie and redirect
```python
response = RedirectResponse(url="https://your-frontend-domain/items")
response.set_cookie(
    key="auth_token",
    value=jwt_token,
    httponly=True,
    secure=True,
    samesite="lax"
)
return response
```

### Fix CSRF/Session issues
- Use sticky sessions on Cloud Run (if using session-based CSRF)
- Or use stateless CSRF tokens (store state in cookie with signature)
- Or switch to PKCE flow (Proof Key for Code Exchange) which doesn't require server-side session state

## Testing

### To test the current frontend fix:
1. Click "Continue with Google" on `/login`
2. Complete Google OAuth
3. Open browser DevTools Console (F12)
4. Look for logged messages:
   - "✓ Found token in query params" (if backend redirects with token)
   - "✓ Successfully parsed page as JSON" (if backend returns raw JSON)
   - "✓ Found JSON embedded in HTML" (if frontend extracts from HTML)
   - Or error messages explaining what went wrong

### What you should see in logs:
- Current URL after OAuth redirect
- Page content preview
- Whether JSON was found and parsed
- Any error messages

## Recommended Next Steps

1. **Update the backend** (identity service) to redirect to frontend with token in query param (Option 1 above)
2. **Fix CSRF/session issues** by implementing stateless CSRF or PKCE
3. **Test the flow** end-to-end after backend changes
4. **Optional**: Implement proper JWT exchange (backend issues short-lived JWT after validating Google token)

## Backend Repository
The identity service backend code needs to be updated in the `ms1-identity` Cloud Run service.

Contact: yg3066@columbia.edu (last deployed the service)

## Related Files
- Frontend: `src/pages/OAuthCallback.tsx`
- Frontend: `src/pages/Login.tsx`
- Backend endpoint: `/auth/google/callback` (in identity service)
- Service URL: https://ms1-identity-157498364441.us-east1.run.app
