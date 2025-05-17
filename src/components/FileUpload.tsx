import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseExcelFile } from '../utils/excelUtils';
import { Student } from '../utils/types';
import { UPLOAD_ENDPOINT } from '../utils/config';
import { uploadExcelFile, getExcelFiles, ExcelFile, getMostRecentExcelFile } from '../utils/excelStorageUtils';
import { useAuth } from '../utils/AuthContext';

interface FileUploadProps {
  onFileProcessed: (students: Student[]) => void;
  existingStudents?: Student[];
  isMergeMode?: boolean;
  onToggleMergeMode?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileProcessed, 
  existingStudents = [], 
  isMergeMode = false, 
  onToggleMergeMode
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [savedExcelFiles, setSavedExcelFiles] = useState<ExcelFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState<ExcelFile | null>(null);
  const [showFileOptions, setShowFileOptions] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load saved Excel files when component mounts
  useEffect(() => {
    if (user) {
      loadSavedExcelFiles();
    }
  }, [user]);

  // Load saved Excel files from the server
  const loadSavedExcelFiles = async () => {
    if (!user) return;
    
    setIsLoadingFiles(true);
    try {
      const files = await getExcelFiles();
      setSavedExcelFiles(files);
      
      // Auto-select the most recent file
      if (files.length > 0) {
        const mostRecent = files.sort((a, b) => b.timestamp - a.timestamp)[0];
        setSelectedExcelFile(mostRecent);
      }
    } catch (error) {
      console.error('Failed to load saved Excel files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Handle loading an Excel file from the server
  const handleLoadSavedFile = async (file: ExcelFile) => {
    if (!file || !file.url) {
      console.error('Invalid file or file URL is missing');
      return;
    }
    
    setIsUploading(true);
    try {
      // Fetch the file from the server
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Error fetching file: ${response.statusText}`);
      }
      
      // Convert to blob then File object
      const blob = await response.blob();
      const excelFile = new File([blob], file.originalName, { 
        type: file.originalName.endsWith('.xlsx') 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/vnd.ms-excel' 
      });
      
      // Process the file
      setSelectedExcelFile(file);
      await processExcelFile(excelFile);
    } catch (error) {
      console.error('Error loading saved Excel file:', error);
      alert('Failed to load the selected Excel file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle deletion of a saved Excel file
  const handleDeleteFile = async (filename: string) => {
    if (!user || !confirm('Are you sure you want to delete this Excel file? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Log the request details for debugging
      console.log('Attempting to delete file:', filename);
      console.log('Using endpoint:', `${UPLOAD_ENDPOINT.replace('upload-photo.php', 'delete-excel.php')}`);
      console.log('With payload:', { username: user.username, filename });
      
      const response = await fetch(`${UPLOAD_ENDPOINT.replace('upload-photo.php', 'delete-excel.php')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          filename: filename
        }),
      });

      console.log('Delete response status:', response.status);
      const responseText = await response.text();
      console.log('Delete response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error(`Server returned invalid JSON. Response: ${responseText}`);
      }

      if (result.status === 'success') {
        // Update local state to remove the file
        setSavedExcelFiles(prev => prev.filter(f => f.filename !== filename));
        
        // If the deleted file was selected, clear the selection
        if (selectedExcelFile?.filename === filename) {
          setSelectedExcelFile(null);
        }

        // Hide options menu
        setShowFileOptions(null);
      } else {
        throw new Error(result.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Failed to delete the file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle clearing all saved Excel files
  const handleClearAllFiles = async () => {
    if (!user || !confirm('Are you sure you want to delete ALL Excel files? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Log the request details for debugging
      console.log('Attempting to clear all files');
      console.log('Using endpoint:', `${UPLOAD_ENDPOINT.replace('upload-photo.php', 'clear-excel-files.php')}`);
      console.log('With payload:', { username: user.username });
      
      const response = await fetch(`${UPLOAD_ENDPOINT.replace('upload-photo.php', 'clear-excel-files.php')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username
        }),
      });

      console.log('Clear all response status:', response.status);
      const responseText = await response.text();
      console.log('Clear all response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error(`Server returned invalid JSON. Response: ${responseText}`);
      }

      if (result.status === 'success' || result.status === 'partial') {
        // Clear local state
        setSavedExcelFiles([]);
        setSelectedExcelFile(null);
        setShowFileOptions(null);
        
        if (result.status === 'partial') {
          console.warn('Some files could not be deleted:', result.failedFiles);
          alert(`${result.deletedCount} files were deleted, but ${result.failedFiles.length} files could not be deleted.`);
        }
      } else {
        throw new Error(result.message || 'Failed to clear files');
      }
    } catch (error) {
      console.error('Error clearing files:', error);
      alert(`Failed to clear files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Process an Excel file
  const processExcelFile = async (file: File) => {
    try {
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
            // If in merge mode, combine with existing students
            if (isMergeMode && existingStudents.length > 0) {
              // Create a map of existing students by name + father's name + DOB to check for duplicates
              const existingMap = new Map<string, Student>();
              existingStudents.forEach(student => {
                const key = `${student.name}|${student.fatherName}|${student.dob}`.toLowerCase();
                existingMap.set(key, student);
              });
              
              // Filter out duplicates from new data
              const newUniqueStudents = result.data.filter((newStudent: Student) => {
                const key = `${newStudent.name}|${newStudent.fatherName}|${newStudent.dob}`.toLowerCase();
                return !existingMap.has(key);
              });
              
              // Combine existing and new unique students
              onFileProcessed([...existingStudents, ...newUniqueStudents]);
            } else {
              // Replace mode - just use the new data
              onFileProcessed(result.data);
            }
            return;
          }
        }
        
        // If server-side processing fails, fall back to client-side
        console.log('Falling back to client-side processing');
        const students = await parseExcelFile(file);
        
        // If in merge mode, combine with existing students
        if (isMergeMode && existingStudents.length > 0) {
          // Create a map of existing students by name + father's name + DOB to check for duplicates
          const existingMap = new Map<string, Student>();
          existingStudents.forEach(student => {
            const key = `${student.name}|${student.fatherName}|${student.dob}`.toLowerCase();
            existingMap.set(key, student);
          });
          
          // Filter out duplicates from new data
          const newUniqueStudents = students.filter(newStudent => {
            const key = `${newStudent.name}|${newStudent.fatherName}|${newStudent.dob}`.toLowerCase();
            return !existingMap.has(key);
          });
          
          // Combine existing and new unique students
          onFileProcessed([...existingStudents, ...newUniqueStudents]);
        } else {
          // Replace mode - just use the new data
          onFileProcessed(students);
        }
      } catch (error) {
        // Network error or other issues, fall back to client-side
        console.log('API error, using client-side fallback', error);
        const students = await parseExcelFile(file);
        
        // If in merge mode, combine with existing students
        if (isMergeMode && existingStudents.length > 0) {
          // Create a map of existing students by name + father's name + DOB to check for duplicates
          const existingMap = new Map<string, Student>();
          existingStudents.forEach(student => {
            const key = `${student.name}|${student.fatherName}|${student.dob}`.toLowerCase();
            existingMap.set(key, student);
          });
          
          // Filter out duplicates from new data
          const newUniqueStudents = students.filter(newStudent => {
            const key = `${newStudent.name}|${newStudent.fatherName}|${newStudent.dob}`.toLowerCase();
            return !existingMap.has(key);
          });
          
          // Combine existing and new unique students
          onFileProcessed([...existingStudents, ...newUniqueStudents]);
        } else {
          // Replace mode - just use the new data
          onFileProcessed(students);
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing the Excel file. Please make sure it contains the required columns.');
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      setIsUploading(true);
      const file = acceptedFiles[0];
      
      // First, upload the file to the server for future use
      if (user) {
        try {
          const uploadResult = await uploadExcelFile(file);
          if (uploadResult) {
            console.log('Excel file uploaded to server successfully');
            // Refresh the list of saved files
            await loadSavedExcelFiles();
          } else {
            console.warn('Failed to upload Excel file to server. Continuing with local processing only.');
          }
        } catch (uploadError) {
          console.error('Error uploading Excel file to server:', uploadError);
          // Continue with local processing despite upload error
        }
      }
      
      // Then process the file content
      await processExcelFile(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing the Excel file. Please make sure it contains the required columns.');
    } finally {
      setIsUploading(false);
    }
  }, [onFileProcessed, isMergeMode, existingStudents, user]);
  
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
    <div className="w-full max-w-4xl mx-auto">
      {onToggleMergeMode && (
        <div className="mb-5 flex items-center justify-end">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMergeMode}
              onChange={onToggleMergeMode}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-100%] after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ms-3 text-sm font-medium text-gray-700">
              {isMergeMode ? 'Merge with existing data' : 'Replace existing data'}
            </span>
          </label>
        </div>
      )}

      {/* Previously saved Excel files section */}
      {user && savedExcelFiles.length > 0 && (
        <div className="mb-6 bg-blue-50 rounded-xl border border-blue-100 shadow-soft-md overflow-hidden animate-slide-up">
          <div className="flex justify-between items-center px-5 py-3 bg-blue-100/50">
            <h3 className="text-sm font-semibold text-blue-800 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Your saved Excel files
            </h3>
            {savedExcelFiles.length > 1 && (
              <button 
                onClick={handleClearAllFiles}
                disabled={isDeleting}
                className="text-xs font-medium flex items-center px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete All
                  </>
                )}
              </button>
            )}
          </div>
          <div className="p-4 pt-2 max-h-60 overflow-y-auto">
            {savedExcelFiles.map((file, index) => (
              <div key={index} className="relative">
                <div 
                  className={`p-3 my-1.5 rounded-lg cursor-pointer flex items-center text-sm ${
                    selectedExcelFile?.filename === file.filename 
                      ? 'bg-blue-200/60 border border-blue-300'
                      : 'hover:bg-blue-100/50 bg-white border border-blue-50 shadow-sm'
                  }`}
                  onClick={() => {
                    setShowFileOptions(null);
                    handleLoadSavedFile(file);
                  }}
                >
                  <div className="bg-blue-100 p-2 rounded-lg mr-3 text-blue-600 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{file.originalName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(file.timestamp * 1000).toLocaleDateString()} {new Date(file.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  
                  <button 
                    className="ml-2 p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-full focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFileOptions(showFileOptions === file.filename ? null : file.filename);
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
                
                {/* Options menu */}
                {showFileOptions === file.filename && (
                  <div className="absolute right-2 top-12 w-44 bg-white shadow-lg rounded-lg overflow-hidden z-10 border border-gray-200 animate-fade-in">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSavedFile(file);
                        setShowFileOptions(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Load File
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.filename);
                      }}
                      disabled={isDeleting}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {isDeleting ? 'Deleting...' : 'Delete File'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!user && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 shadow-soft-md animate-slide-up">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Please log in</span> to save your Excel files and access them from any device.
          </p>
        </div>
      )}
      
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 bg-card
          ${isDragActive 
            ? 'border-primary-400 bg-primary-50 shadow-soft-md' 
            : isUploading
              ? 'border-amber-300 bg-amber-50 cursor-wait'
              : 'border-gray-300 hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-soft-md'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`p-4 rounded-full ${
            isDragActive ? 'bg-primary-100 text-primary-600' : 
            isUploading ? 'bg-amber-100 text-amber-600' : 
            'bg-gray-100 text-gray-500'
          }`}>
            <svg 
              className="w-12 h-12" 
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
          </div>
          {isDragActive ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-primary-600">Drop the Excel file here...</p>
              <p className="text-sm text-primary-500">Release to upload</p>
            </div>
          ) : isUploading ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-amber-600">Processing file...</p>
              <div className="w-full max-w-xs mx-auto bg-amber-100 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop an Excel file here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports .xlsx and .xls files
                </p>
              </div>
              
              {selectedExcelFile && (
                <div className="mt-4 px-4 py-3 bg-primary-50 border border-primary-100 rounded-lg inline-flex items-center text-sm text-primary-700">
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Currently using: <span className="font-semibold ml-1">{selectedExcelFile.originalName}</span>
                </div>
              )}
              
              {isMergeMode && (
                <div className="mt-2 px-4 py-3 bg-accent-50 border border-accent-100 rounded-lg inline-flex items-center text-sm text-accent-700">
                  <svg className="w-5 h-5 mr-2 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New students will be added to your existing data
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 