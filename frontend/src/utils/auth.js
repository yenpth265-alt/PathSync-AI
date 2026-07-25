// frontend/src/utils/auth.js

/**
 * Decodes a JWT token without verifying the signature (safe for frontend display purposes)
 * @param {string} token 
 * @returns {object|null}
 */
export function decodeJWT(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode token", e);
    return null;
  }
}

/**
 * Gets the current user object from the stored token
 */
export function getCurrentUser() {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  // Our backend (auth-service) creates token with claims: user_id, email (and optionally name if we added it)
  // Wait, did we add full_name to claims?
  return decoded;
}

/**
 * Gets the auth token
 */
export function getAuthToken() {
  return localStorage.getItem('auth_token');
}
