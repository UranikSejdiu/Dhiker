import AsyncStorage from '@react-native-async-storage/async-storage';

// Local development fallback API domain. 
// Replace this with your Plesk domain (e.g. 'https://yourdomain.com') when running locally!
const DEV_API_URL = 'https://dhikr.uranik.sejdiu.net';

/**
 * Resolves the absolute or relative URL for the PHP API based on the environment.
 */
export const getApiUrl = (action: string) => {
  if (typeof window !== 'undefined') {
    // When debugging locally on localhost, point to the dev domain.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${DEV_API_URL}/api/index.php?action=${action}`;
    }
    return `${window.location.origin}/api/index.php?action=${action}`;
  }
  return `/api/index.php?action=${action}`;
};

/**
 * Custom fetch helper that handles JSON encoding, token headers, and errors
 */
export async function apiRequest(action: string, method: 'GET' | 'POST', body?: any) {
  let url = getApiUrl(action);
  
  let token: string | null = null;
  try {
    const sessionJson = await AsyncStorage.getItem('@my_dhikr_user_session');
    if (sessionJson) {
      const session = JSON.parse(sessionJson);
      token = session.session_token || null;
    }
  } catch (err) {
    console.debug('Failed to load token from AsyncStorage:', err);
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    // If session expired, clear local storage and redirect to login
    if (data.error === 'Session expired. Please log in again.') {
      try {
        await AsyncStorage.removeItem('@my_dhikr_user_session');
      } catch {}
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error(data.error || `API Request failed with status ${response.status}`);
  }
  
  return data;
}
