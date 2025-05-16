/**
 * Environment utility functions for handling browser vs SSG environments
 */

/**
 * Safely check if the code is running in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Safely get the current origin (or fallback to an environment variable or empty string)
 */
export const getSiteOrigin = (): string => {
  if (isBrowser() && window.location && window.location.origin) {
    return window.location.origin;
  }
  
  // Fallback to environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Last resort fallback for static generation
  return '';
};

/**
 * Safely construct a full URL from a path
 * @param path The path to convert to a full URL
 */
export const getFullUrl = (path: string): string => {
  if (!path) return '';
  
  // If it's already an absolute URL, return it
  if (path.startsWith('http')) {
    return path;
  }
  
  const origin = getSiteOrigin();
  
  // Handle paths with or without leading slash
  return path.startsWith('/') 
    ? `${origin}${path}`
    : `${origin}/${path}`;
}; 