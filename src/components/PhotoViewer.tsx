import React, { useState, useEffect } from 'react';
import { getFullUrl } from '../utils/environmentUtils';

interface PhotoViewerProps {
  photoPath: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ 
  photoPath, 
  alt = 'Student Photo', 
  width = 150, 
  height = 180,
  className = ''
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (!photoPath) {
      setImageSrc(null);
      setError(false);
      setErrorMessage('');
      return;
    }
    
    // Reset states when photoPath changes
    setError(false);
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      // Check if it's a data URL (localStorage fallback)
      if (photoPath.startsWith('data:')) {
        console.log('Using data URL image');
        setImageSrc(photoPath);
        setError(false);
        setIsLoading(false);
        return;
      }
      
      // Check if it's a localStorage key related to a photo path
      if (photoPath.includes('/photos/')) {
        const filename = photoPath.split('/').pop();
        if (filename) {
          const localStorageKey = `photo_${filename}`;
          console.log('Looking for localStorage key:', localStorageKey);
          const storedImage = localStorage.getItem(localStorageKey);
          
          if (storedImage) {
            console.log('Using localStorage image for:', filename);
            setImageSrc(storedImage);
            setError(false);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Handle remote URLs
      if (photoPath.startsWith('http')) {
        console.log('Using remote URL:', photoPath);
        
        // For Hostinger URLs, check if the image exists first
        if (photoPath.includes('hostingersite.com')) {
          // Create a new image object to test loading
          const img = new Image();
          img.onload = () => {
            console.log(`Remote image loaded successfully: ${photoPath}`);
            setImageSrc(photoPath);
            setError(false);
            setIsLoading(false);
          };
          img.onerror = () => {
            console.error(`Remote image failed to load: ${photoPath}`);
            handleRemoteImageError(photoPath);
          };
          img.src = photoPath;
          return;
        }
        
        // For other URLs
        setImageSrc(photoPath);
        setIsLoading(false);
        return;
      }
      
      // Handle relative paths
      if (photoPath.startsWith('/')) {
        const fullUrl = getFullUrl(photoPath);
        console.log('Using relative URL:', fullUrl);
        setImageSrc(fullUrl);
        setIsLoading(false);
        return;
      }
      
      // If we get here with no valid image source, set an error
      console.error('Invalid image path format:', photoPath);
      setErrorMessage('Invalid image path format');
      setError(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing image path:', err);
      setErrorMessage('Error processing image path');
      setError(true);
      setIsLoading(false);
    }
  }, [photoPath]);
  
  // Handle remote image error specifically
  const handleRemoteImageError = (path: string) => {
    console.error('Remote image failed to load:', path);
    
    // Try to recover using localStorage
    if (path.includes('/photos/')) {
      const filename = path.split('/').pop();
      if (filename) {
        const localStorageKey = `photo_${filename}`;
        const storedImage = localStorage.getItem(localStorageKey);
        if (storedImage) {
          console.log('Recovered image from localStorage after remote failure');
          setImageSrc(storedImage);
          setError(false);
          setIsLoading(false);
          return;
        }
      }
    }
    
    setErrorMessage(`Failed to load image from server`);
    setError(true);
    setIsLoading(false);
  };
  
  // Handle image loading error
  const handleError = () => {
    console.error('Error loading image from path:', photoPath);
    
    // Try to recover by checking localStorage if we have a remote URL that failed
    if (photoPath && photoPath.includes('/photos/')) {
      const filename = photoPath.split('/').pop();
      if (filename) {
        const localStorageKey = `photo_${filename}`;
        const storedImage = localStorage.getItem(localStorageKey);
        if (storedImage) {
          console.log('Recovered image from localStorage after remote failure');
          setImageSrc(storedImage);
          setError(false);
          return;
        }
      }
    }
    
    setErrorMessage(`Failed to load image`);
    setError(true);
  };
  
  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="animate-pulse text-blue-500">Loading...</div>
      </div>
    );
  }
  
  if (!imageSrc || error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg 
          className="w-10 h-10 mb-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        {errorMessage && (
          <span className="text-xs text-red-500 text-center px-1">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      width={width} 
      height={height} 
      className={`object-cover ${className}`}
      onError={handleError}
    />
  );
};

export default PhotoViewer; 