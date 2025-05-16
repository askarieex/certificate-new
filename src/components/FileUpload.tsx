import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseExcelFile } from '../utils/excelUtils';
import { Student } from '../utils/types';
import { UPLOAD_ENDPOINT } from '../utils/config';

interface FileUploadProps {
  onFileProcessed: (students: Student[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      setIsUploading(true);
      const file = acceptedFiles[0];
      
      // Try server-side processing first
      const formData = new FormData();
      formData.append('excelFile', file);
      
      try {
        const response = await fetch(UPLOAD_ENDPOINT, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && Array.isArray(result.data)) {
            onFileProcessed(result.data);
            return;
          }
        }
        
        // If server-side processing fails, fall back to client-side
        console.log('Falling back to client-side processing');
        const students = await parseExcelFile(file);
        onFileProcessed(students);
      } catch (error) {
        // Network error or other issues, fall back to client-side
        console.log('API error, using client-side fallback', error);
        const students = await parseExcelFile(file);
        onFileProcessed(students);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing the Excel file. Please make sure it contains the required columns.');
    } finally {
      setIsUploading(false);
    }
  }, [onFileProcessed]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isUploading
  });
  
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : isUploading
              ? 'border-yellow-300 bg-yellow-50 cursor-wait'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3">
          <svg 
            className={`w-16 h-16 ${isDragActive ? 'text-blue-500' : isUploading ? 'text-yellow-500' : 'text-gray-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-500">Drop the Excel file here...</p>
          ) : isUploading ? (
            <p className="text-lg font-medium text-yellow-600">Processing file...</p>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drag & drop an Excel file here, or click to select
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports .xlsx and .xls files
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 