/**
 * Configuration settings for the application
 */

// API endpoints
export const API_BASE_URL = 'https://grey-frog-921983.hostingersite.com';
export const UPLOAD_ENDPOINT = `${API_BASE_URL}/api/upload-photo.php`;
export const GENERATE_ENDPOINT = `${API_BASE_URL}/api/generate.php`;

// Local API endpoints
export const LOCAL_UPLOAD_ENDPOINT = '/api/upload-photo';
export const LOCAL_GENERATE_ENDPOINT = '/api/generate-certificate';

// File paths
export const PHOTOS_PATH = '/photos';
export const OUTPUT_PATH = '/output';

// App settings
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];
export const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';

// Feature flags
export const ENABLE_EXCEL_EXPORT = true;
export const ENABLE_WORD_EXPORT = true;
export const ENABLE_PDF_EXPORT = true;

// Debugging
export const DEBUG_MODE = process.env.NODE_ENV === 'development';

/**
 * Log a message only if in debug mode
 */
export const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

/**
 * Get the appropriate API endpoint based on environment
 */
export const getApiEndpoint = (endpoint: string) => {
  // Use local endpoints in development, remote in production
  if (process.env.NODE_ENV === 'development') {
    if (endpoint === 'upload') return LOCAL_UPLOAD_ENDPOINT;
    if (endpoint === 'generate') return LOCAL_GENERATE_ENDPOINT;
  }
  
  if (endpoint === 'upload') return UPLOAD_ENDPOINT;
  if (endpoint === 'generate') return GENERATE_ENDPOINT;
  
  return '';
};

// Define API endpoints
export const API_ENDPOINTS = {
  PHOTO_UPLOAD: '/api/upload-photo',
  PHOTO_UPLOAD_PHP: '/api/upload-photo.php',
  GENERATE_CERTIFICATE: '/api/generate-certificate',
  TEST_CONNECTION: '/api/test-connection.php',
  CORS_TEST: '/api/cors-test.php'
};

// Combine base URL with endpoints
export const PHOTO_UPLOAD_ENDPOINT = `${API_BASE_URL}${API_ENDPOINTS.PHOTO_UPLOAD}`;
export const PHOTO_UPLOAD_PHP_ENDPOINT = `${API_BASE_URL}${API_ENDPOINTS.PHOTO_UPLOAD_PHP}`;
export const GENERATE_CERTIFICATE_ENDPOINT = `${API_BASE_URL}${API_ENDPOINTS.GENERATE_CERTIFICATE}`;
export const TEST_CONNECTION_ENDPOINT = `${API_BASE_URL}${API_ENDPOINTS.TEST_CONNECTION}`;
export const CORS_TEST_ENDPOINT = `${API_BASE_URL}${API_ENDPOINTS.CORS_TEST}`;

// Add the missing exports needed by components
export const OUTPUT_PATH_FULL = `${API_BASE_URL}${OUTPUT_PATH}`;

// Define photo URLs
export const getPhotoUrl = (filename: string): string => {
  // First check if it's already a full URL
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // Check if it's a path starting with /
  if (filename.startsWith('/')) {
    return `${API_BASE_URL}${filename}`;
  }
  
  // Otherwise, assume it's just a filename and construct the full path
  return `${API_BASE_URL}/photos/${filename}`;
};

// Define fallback URL when remote access fails
export const LOCAL_STORAGE_FALLBACK = true;

// Define configuration for photo uploads
export const PHOTO_CONFIG = {
  MAX_WIDTH: 150,
  MAX_HEIGHT: 180,
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  MAX_SIZE_MB: 2,
};

// Define error messages
export const ERROR_MESSAGES = {
  UPLOAD_FAILED: 'Failed to upload photo. Please try again.',
  INVALID_IMAGE: 'Please select a valid image file (JPG, PNG, or GIF).',
  IMAGE_TOO_LARGE: `Image is too large. Maximum size is ${PHOTO_CONFIG.MAX_SIZE_MB}MB.`,
  SERVER_ERROR: 'Server error. Please try again later.',
  CERTIFICATE_GENERATION_FAILED: 'Failed to generate certificate. Please try again.',
}; 