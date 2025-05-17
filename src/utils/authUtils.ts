import { API_BASE_URL, AUTH_STORAGE_KEY } from './config';
import Cookies from 'js-cookie';

export interface User {
  username: string;
  name: string;
  role: string;
  token?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Check if user is logged in
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check both localStorage and cookies
  const userJson = localStorage.getItem(AUTH_STORAGE_KEY);
  const authToken = Cookies.get('auth_token');
  
  return !!(userJson && authToken);
};

// Get the current user
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userJson = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!userJson) return null;
    
    // Verify that the token in cookies matches
    const user = JSON.parse(userJson) as User;
    const authToken = Cookies.get('auth_token');
    
    if (!authToken || !user.token || authToken !== user.token) {
      // Token mismatch, clear authentication
      logout();
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    return null;
  }
};

// Export getAuthUser as an alias to getCurrentUser for compatibility
export const getAuthUser = getCurrentUser;

// Login function
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    // For local development without API, use mock authentication
    if (process.env.NEXT_PUBLIC_IS_STATIC === 'true') {
      // In static builds, always use the server API
      const response = await fetch(`${API_BASE_URL}/api/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Store user in localStorage and cookies
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      Cookies.set('auth_token', data.user.token || '', { expires: 1 }); // 1 day expiry
      
      return data.user;
    } else {
      // Real API authentication
      const response = await fetch(`${API_BASE_URL}/api/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Store user in localStorage and cookies
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      Cookies.set('auth_token', data.user.token || '', { expires: 1 }); // 1 day expiry
      
      return data.user;
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout function
export const logout = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    Cookies.remove('auth_token');
  } catch (error) {
    console.error('Logout error:', error);
  }
}; 