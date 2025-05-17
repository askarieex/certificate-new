import { Student } from './types';
import { SAVE_DATA_ENDPOINT, LOAD_DATA_ENDPOINT, ERROR_MESSAGES } from './config';
import { getAuthUser } from './authUtils';

/**
 * Save student data to the server
 * @param students - Array of student data to save
 * @returns Promise resolving to success status
 */
export const saveStudentsToServer = async (students: Student[]): Promise<boolean> => {
  try {
    // Get current user
    const user = getAuthUser();
    if (!user) {
      console.warn('No authenticated user found. Skipping server save.');
      return false;
    }

    const response = await fetch(SAVE_DATA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username,
        students: students,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Failed to save data to server:', error);
    return false;
  }
};

/**
 * Load student data from the server
 * @returns Promise resolving to array of students or null if failed
 */
export const loadStudentsFromServer = async (): Promise<Student[] | null> => {
  try {
    // Get current user
    const user = getAuthUser();
    if (!user) {
      console.warn('No authenticated user found. Skipping server load.');
      return null;
    }

    const response = await fetch(`${LOAD_DATA_ENDPOINT}?username=${encodeURIComponent(user.username)}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success' && Array.isArray(result.data)) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load data from server:', error);
    return null;
  }
};

/**
 * Hybrid approach to save data both locally and to the server
 * @param students - Array of student data to save
 * @param localStorageKey - Key to use for localStorage
 */
export const saveStudentsHybrid = async (
  students: Student[], 
  localStorageKey: string = 'certificateAppState'
): Promise<void> => {
  // Always save to localStorage first for reliability
  if (typeof window !== 'undefined') {
    try {
      const appState = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          ...appState,
          students,
        })
      );
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }
  
  // Then try to save to server if we have an authenticated user
  const user = getAuthUser();
  if (user) {
    await saveStudentsToServer(students);
  } else {
    console.warn('No authenticated user found. Data saved only to localStorage.');
  }
};

/**
 * Hybrid approach to load data from server first, then fall back to localStorage
 * @param localStorageKey - Key to use for localStorage
 * @returns Promise resolving to array of students
 */
export const loadStudentsHybrid = async (
  localStorageKey: string = 'certificateAppState'
): Promise<Student[]> => {
  // Try to load from server first
  const user = getAuthUser();
  let serverData = null;
  
  if (user) {
    serverData = await loadStudentsFromServer();
  }
  
  if (serverData) {
    // If successful, update localStorage with server data
    if (typeof window !== 'undefined') {
      try {
        const appState = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
        localStorage.setItem(
          localStorageKey,
          JSON.stringify({
            ...appState,
            students: serverData,
          })
        );
      } catch (e) {
        console.error('Failed to update localStorage with server data:', e);
      }
    }
    return serverData;
  }
  
  // Fall back to localStorage if server load fails or no user
  if (typeof window !== 'undefined') {
    try {
      const appState = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      return appState.students || [];
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      return [];
    }
  }
  
  return [];
}; 