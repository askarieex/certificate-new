/**
 * File utility functions for handling file operations in both development and production
 */
import { isBrowser } from './environmentUtils';

/**
 * Save a file to the server or local filesystem
 * In development: sends to API
 * In static builds: uses browser APIs
 */
export const saveFile = async (
  path: string, 
  content: string
): Promise<boolean> => {
  // Detect if we're in a static build environment (no server)
  const isStaticBuild = process.env.NEXT_PUBLIC_IS_STATIC === 'true' || !isBrowser();
  
  try {
    if (isStaticBuild) {
      // In static builds, we can't write to server filesystem
      // Instead, we can use browser APIs to download the file
      
      // First store in localStorage so we can access it later
      const filename = path.split('/').pop() || 'certificate.html';
      localStorage.setItem(`certificate_${filename}`, content);
      
      // Create a download for the user
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      return true;
    } else {
      // In development with a server, we could send to an API
      // This is just a placeholder - replace with your actual API call
      console.log('Would save file to server at', path);
      return true;
    }
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
};

/**
 * Open a file for viewing
 * Handles different path formats for development vs production
 */
export const openFile = (path: string): void => {
  if (!path) return;
  
  // Clean the path to ensure proper format
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // For static hosting, check if we have this stored in localStorage
  const filename = cleanPath.split('/').pop() || '';
  const storedContent = localStorage.getItem(`certificate_${filename}`);
  
  if (storedContent) {
    // Create a blob and open it
    const blob = new Blob([storedContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in a new tab
    window.open(url, '_blank');
    
    // Don't revoke immediately so the user can view it
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }
  
  // Fallback to direct URL
  window.open(cleanPath, '_blank');
};

/**
 * Get the proper URL for a file
 */
export const getFileUrl = (path: string): string => {
  if (!path) return '';
  
  // Check if it's already a full URL
  if (path.startsWith('http')) {
    return path;
  }
  
  // Clean the path to ensure proper format
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // If we're in a browser, use the current origin
  if (isBrowser() && window.location) {
    const origin = window.location.origin;
    return `${origin}/${cleanPath}`;
  }
  
  // Fallback
  return cleanPath;
}; 