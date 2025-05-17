import { SAVE_EXCEL_ENDPOINT, GET_EXCEL_FILES_ENDPOINT, ERROR_MESSAGES } from './config';
import { getAuthUser } from './authUtils';

export interface ExcelFile {
  filename: string;
  originalName: string;
  timestamp: number;
  date: string;
  size: number;
  url: string;
}

/**
 * Upload an Excel file to the server
 * @param file The Excel file to upload
 * @returns Promise resolving to the uploaded file information or null if failed
 */
export const uploadExcelFile = async (file: File): Promise<{ filepath: string } | null> => {
  try {
    // Get current user
    const user = getAuthUser();
    if (!user) {
      console.warn('No authenticated user found. Cannot upload Excel file to server.');
      return null;
    }

    // Create form data
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('username', user.username);

    // Upload file
    const response = await fetch(SAVE_EXCEL_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown error');
    }

    return {
      filepath: result.filepath
    };
  } catch (error) {
    console.error('Failed to upload Excel file:', error);
    return null;
  }
};

/**
 * Get a list of Excel files for the current user
 * @returns Promise resolving to an array of Excel files
 */
export const getExcelFiles = async (): Promise<ExcelFile[]> => {
  try {
    // Get current user
    const user = getAuthUser();
    if (!user) {
      console.warn('No authenticated user found. Cannot retrieve Excel files from server.');
      return [];
    }

    // Get files
    const response = await fetch(`${GET_EXCEL_FILES_ENDPOINT}?username=${encodeURIComponent(user.username)}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown error');
    }

    return result.files || [];
  } catch (error) {
    console.error('Failed to get Excel files:', error);
    return [];
  }
};

/**
 * Get the most recently uploaded Excel file URL
 * @returns Promise resolving to the URL of the most recent Excel file or null if none found
 */
export const getMostRecentExcelFile = async (): Promise<ExcelFile | null> => {
  try {
    const user = getAuthUser();
    if (!user) {
      console.warn('No authenticated user found. Cannot retrieve most recent Excel file.');
      return null;
    }
    
    const files = await getExcelFiles();
    
    if (files.length === 0) {
      return null;
    }
    
    // Sort by timestamp (most recent first)
    const sortedFiles = [...files].sort((a, b) => b.timestamp - a.timestamp);
    return sortedFiles[0];
  } catch (error) {
    console.error('Failed to get most recent Excel file:', error);
    return null;
  }
}; 