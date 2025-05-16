import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL, PHOTO_UPLOAD_ENDPOINT } from './config';

// Function to resize an image
export const resizeImage = (
  file: File,
  maxWidth: number = 150,
  maxHeight: number = 180
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate the new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert back to file
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          
          resolve(resizedFile);
        }, file.type);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

// Function to save a photo and return its path
export const savePhoto = async (
  file: File, 
  onProgress?: ((progress: number) => void) | null
): Promise<string> => {
  try {
    // Generate a unique ID for the photo
    const uniqueId = uuidv4();
    console.log(`Starting photo upload, file: ${file.name}, ID: ${uniqueId}`);
    
    // Report initial progress
    if (typeof onProgress === 'function') {
      onProgress(10);
    }
    
    // Resize the image first
    const resizedFile = await resizeImage(file);
    console.log(`Image resized successfully: ${resizedFile.size} bytes`);
    
    // Report progress after resize
    if (typeof onProgress === 'function') {
      onProgress(30);
    }
    
    // Generate a unique filename
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uniqueId}_${Math.random().toString(36).substring(2, 10)}.${extension}`;
    console.log(`Generated filename: ${fileName}`);
    
    // Save data in localStorage as a fallback RIGHT AWAY
    const reader = new FileReader();
    const localStoragePromise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64data = reader.result as string;
        try {
          localStorage.setItem(`photo_${fileName}`, base64data);
          console.log(`Photo saved to localStorage with key photo_${fileName}`);
          resolve(`data:${file.type};base64,${base64data.split(',')[1]}`);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
          resolve('');
        }
      };
      reader.readAsDataURL(resizedFile);
    });
    
    // Start saving to localStorage immediately, don't wait
    const localStorageTask = localStoragePromise;
    
    // Report progress after localStorage save
    if (typeof onProgress === 'function') {
      onProgress(50);
    }
    
    // Try server-side uploads in sequence with proper error handling
    try {
      // Try remote PHP server first
      console.log("Attempting remote server upload to Hostinger API");
      
      const formData = new FormData();
      formData.append('photo', resizedFile);
      formData.append('fileName', fileName);
      
      // Set a reasonable timeout for the server request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const remoteResponse = await fetch('https://grey-frog-921983.hostingersite.com/api/upload-photo.php', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        console.log("Remote server response status:", remoteResponse.status);
        
        // Report progress after remote upload attempt
        if (typeof onProgress === 'function') {
          onProgress(80);
        }
        
        // Check if the response is ok (status 200-299)
        if (remoteResponse.ok) {
          let result;
          try {
            const responseText = await remoteResponse.text();
            console.log("Raw response:", responseText);
            
            try {
              result = JSON.parse(responseText);
              console.log("Parsed response:", result);
            } catch (jsonError) {
              console.error("Error parsing JSON response:", jsonError);
              throw new Error("Invalid JSON response from server");
            }
            
            if (result && result.status === 'success' && result.photoPath) {
              console.log("Remote server upload successful, photo path:", result.photoPath);
              // Ensure URL has proper domain
              const fullPath = result.photoPath.startsWith('http') 
                ? result.photoPath
                : `https://grey-frog-921983.hostingersite.com${result.photoPath}`;
              
              console.log("Full photo URL:", fullPath);
              
              // Wait for localStorage to complete as well for backup
              await localStorageTask;
              
              // Report completion
              if (typeof onProgress === 'function') {
                onProgress(100);
              }
              
              return fullPath;
            } else {
              console.error("Invalid response format from server:", result);
              throw new Error("Invalid response format from server");
            }
          } catch (processError) {
            console.error("Error processing server response:", processError);
            throw processError;
          }
        } else {
          console.error("Remote server returned error status:", remoteResponse.status);
          throw new Error(`Server returned status ${remoteResponse.status}`);
        }
      } catch (fetchError: any) {
        console.error("Fetch error with remote server:", fetchError);
        
        // Specific handling for network errors
        if (fetchError.name === 'AbortError') {
          console.error("Request timed out");
        } else if (fetchError instanceof TypeError && fetchError.message.includes('NetworkError')) {
          console.error("Network error - possibly CORS related");
        }
        
        throw fetchError;
      }
    } catch (remoteError) {
      console.error("Remote upload failed, trying local Next.js API:", remoteError);
      
      // Try Local Next.js API route as fallback
      try {
        const formData = new FormData();
        formData.append('photo', resizedFile);
        formData.append('fileName', fileName);
        
        const localApiResponse = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData
        });
        
        // Report progress after local API attempt
        if (typeof onProgress === 'function') {
          onProgress(90);
        }
        
        if (localApiResponse.ok) {
          const localResult = await localApiResponse.json();
          console.log("Local API response:", localResult);
          
          if (localResult.status === 'success' && localResult.photoPath) {
            console.log("Local API upload successful, photo path:", localResult.photoPath);
            const fullPath = window.location.origin + localResult.photoPath;
            console.log("Full local photo URL:", fullPath);
            
            // Report completion
            if (typeof onProgress === 'function') {
              onProgress(100);
            }
            
            return fullPath;
          } else {
            console.error("Invalid response from local API:", localResult);
            throw new Error("Invalid response from local API");
          }
        } else {
          console.error("Local API returned error status:", localApiResponse.status);
          throw new Error(`Local API returned status ${localApiResponse.status}`);
        }
      } catch (localError) {
        console.error("Local API upload failed:", localError);
        throw localError;
      }
    }
    
    // If we reach here, both remote and local uploads failed
    // Use localStorage fallback
    console.log("All server uploads failed, using localStorage fallback");
    const localDataUrl = await localStorageTask;
    
    // Report completion via fallback
    if (typeof onProgress === 'function') {
      onProgress(100);
    }
    
    if (localDataUrl) {
      console.log("Using localStorage image data");
      return localDataUrl;
    } else {
      throw new Error("Failed to save image to localStorage");
    }
    
  } catch (error) {
    console.error("Critical error in photo upload process:", error);
    
    // Final fallback attempt - try to get data from localStorage if available
    try {
      const uniqueId = uuidv4();
      const fileName = `${uniqueId}_${Math.random().toString(36).substring(2, 10)}.jpg`;
      const localStorageKey = `photo_${fileName}`;
      const existingImage = localStorage.getItem(localStorageKey);
      
      if (existingImage) {
        console.log("Final fallback: recovered image from localStorage");
        return existingImage;
      }
    } catch (fallbackError) {
      console.error("Final fallback failed:", fallbackError);
    }
    
    throw error;
  }
}; 