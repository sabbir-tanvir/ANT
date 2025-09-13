// JWT utility functions for authentication

/**
 * Decode JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64 and parse JSON
    const decodedPayload = JSON.parse(atob(paddedPayload));
    
    return decodedPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get user role from JWT access token
 * @param {string} accessToken - JWT access token
 * @returns {string|null} - User role or null if not found
 */
export const getUserRole = (accessToken) => {
  const payload = decodeJWT(accessToken);
  return payload?.role || null;
};

/**
 * Get user ID from JWT access token
 * @param {string} accessToken - JWT access token
 * @returns {string|null} - User ID or null if not found
 */
export const getUserId = (accessToken) => {
  const payload = decodeJWT(accessToken);
  return payload?.user_id || null;
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get stored authentication tokens from localStorage
 * @returns {object|null} - Auth tokens or null if not found
 */
export const getStoredTokens = () => {
  try {
    const authData = localStorage.getItem('authTokens');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return null;
  }
};

/**
 * Store authentication tokens in localStorage
 * @param {object} tokens - Auth tokens object with access and refresh
 */
export const storeTokens = (tokens) => {
  try {
    localStorage.setItem('authTokens', JSON.stringify(tokens));
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

/**
 * Remove authentication tokens from localStorage
 */
export const removeTokens = () => {
  try {
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
    localStorage.removeItem('shopData');
  } catch (error) {
    console.error('Error removing tokens:', error);
  }
};

/**
 * Store shop data in localStorage
 * @param {object} shopData - Shop data object
 */
export const storeShopData = (shopData) => {
  try {
    localStorage.setItem('shopData', JSON.stringify(shopData));
  } catch (error) {
    console.error('Error storing shop data:', error);
  }
};

/**
 * Get stored shop data from localStorage
 * @returns {object|null} - Shop data or null if not found
 */
export const getStoredShopData = () => {
  try {
    const shopData = localStorage.getItem('shopData');
    return shopData ? JSON.parse(shopData) : null;
  } catch (error) {
    console.error('Error getting stored shop data:', error);
    return null;
  }
};

/**
 * Get current authenticated user data
 * @returns {object|null} - User data or null if not authenticated
 */
export const getCurrentUser = () => {
  const tokens = getStoredTokens();
  if (!tokens || !tokens.access || isTokenExpired(tokens.access)) {
    return null;
  }

  const userId = getUserId(tokens.access);
  const role = getUserRole(tokens.access);

  return {
    id: userId,
    role: role,
    isAuthenticated: true,
    accessToken: tokens.access,
    refreshToken: tokens.refresh
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated with valid token
 */
export const isAuthenticated = () => {
  const tokens = getStoredTokens();
  return tokens && tokens.access && !isTokenExpired(tokens.access);
};
