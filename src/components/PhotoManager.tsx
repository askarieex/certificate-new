import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Student } from '../utils/types';
import { savePhoto } from '../utils/photoUtils';
import PhotoViewer from './PhotoViewer';
import { logger } from '../utils/loggingUtils';

interface PhotoManagerProps {
  students: Student[];
  selectedStudents: string[];
  includePhotos: boolean;
  onPhotoToggle: (include: boolean) => void;
  onStudentsUpdate: (updatedStudents: Student[]) => void;
}

const PhotoManager: React.FC<PhotoManagerProps> = ({
  students,
  selectedStudents,
  includePhotos,
  onPhotoToggle,
  onStudentsUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<{success: number, failed: number}>({success: 0, failed: 0});
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  // Handle bulk photo upload
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || selectedStudents.length === 0) return;
    
    try {
      setIsUploading(true);
      setUploadStatus({success: 0, failed: 0});
      const file = acceptedFiles[0];
      const updatedStudents = [...students];
      
      // Track progress
      let processed = 0;
      let successes = 0;
      let failures = 0;
      const total = selectedStudents.length;
      
      logger.info('Starting bulk photo upload', { 
        selectedCount: selectedStudents.length,
        fileName: file.name,
        fileSize: file.size
      });
      
      // Process each selected student
      for (const studentId of selectedStudents) {
        const studentIndex = updatedStudents.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
          try {
            const student = updatedStudents[studentIndex];
            logger.info(`Uploading photo for student: ${student.name}`, { studentId });
            
            const photoPath = await savePhoto(file, studentId);
            updatedStudents[studentIndex] = {
              ...updatedStudents[studentIndex],
              photoPath
            };
            
            successes++;
            logger.info('Photo upload successful', { studentId, photoPath });
          } catch (error) {
            failures++;
            logger.error('Failed to upload photo for student', { 
              studentId, 
              error: error instanceof Error ? error.message : String(error)
            });
          }
          
          // Update progress
          processed++;
          setProgress(Math.round((processed / total) * 100));
          setUploadStatus({success: successes, failed: failures});
        }
      }
      
      // Update the students list with new photos
      onStudentsUpdate(updatedStudents);
      
      if (failures > 0) {
        alert(`${successes} photos uploaded successfully, ${failures} failed.`);
      } else {
        alert(`All ${successes} photos uploaded successfully!`);
      }
      
      logger.info('Bulk photo upload complete', { 
        success: successes, 
        failed: failures,
        total 
      });
    } catch (error) {
      logger.error('Error in bulk photo upload', { error });
      alert('There was an error uploading photos. Check the console for details.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: isUploading || selectedStudents.length === 0,
  });
  
  // Handle individual photo upload
  const handleIndividualUpload = async (studentId: string, file: File) => {
    try {
      setSelectedStudent(studentId);
      
      logger.info('Starting individual photo upload', { 
        studentId,
        fileName: file.name,
        fileSize: file.size
      });
      
      const photoPath = await savePhoto(file, studentId);
      
      // Update student data
      const updatedStudents = students.map(student => 
        student.id === studentId 
          ? { ...student, photoPath } 
          : student
      );
      
      onStudentsUpdate(updatedStudents);
      logger.info('Individual photo upload successful', { studentId, photoPath });
      alert('Photo uploaded successfully!');
    } catch (error) {
      logger.error('Error in individual photo upload', { 
        studentId, 
        error: error instanceof Error ? error.message : String(error)
      });
      alert('Failed to upload photo. Check the console for details.');
    } finally {
      setSelectedStudent(null);
    }
  };
  
  // Get the current selected students
  const selectedStudentObjects = students.filter(student => 
    selectedStudents.includes(student.id)
  );
  
  return (
    <div className="space-y-6">
      {/* Photo toggle switch */}
      <div className="flex items-center justify-between mb-4 p-4 bg-blue-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Include photos in certificates</span>
        <div className="relative inline-block w-12 mr-2 align-middle select-none">
          <input
            type="checkbox"
            id="toggle"
            checked={includePhotos}
            onChange={(e) => onPhotoToggle(e.target.checked)}
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer"
          />
          <label
            htmlFor="toggle"
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
              includePhotos ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          ></label>
        </div>
        <style jsx>{`
          .toggle-checkbox:checked {
            right: 0;
            border-color: #3b82f6;
          }
          .toggle-checkbox:checked + .toggle-label {
            background-color: #3b82f6;
          }
          .toggle-label {
            transition: background-color 0.2s ease;
          }
        `}</style>
      </div>
      
      {/* Bulk upload section */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Photo Upload</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload one photo to be used for all selected students ({selectedStudents.length} selected).
        </p>
        
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : selectedStudents.length === 0 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-70' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          `}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Processing: {progress}%</span>
                <span>Success: {uploadStatus.success} | Failed: {uploadStatus.failed}</span>
              </div>
            </div>
          ) : (
            <>
              <svg
                className={`mx-auto h-12 w-12 ${
                  selectedStudents.length === 0 ? 'text-gray-400' : 'text-gray-500'
                }`}
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
              <p className="mt-2 text-sm text-gray-600">
                {selectedStudents.length === 0
                  ? 'Select students first to enable photo upload'
                  : isDragActive
                  ? 'Drop the photo here...'
                  : 'Drag and drop a photo here, or click to select'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                JPG or PNG only
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Individual photo upload section */}
      {selectedStudentObjects.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Individual Photos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedStudentObjects.map(student => (
              <div key={student.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-4">
                  <div className="font-medium text-gray-800 truncate">{student.name}</div>
                  <div className="text-gray-500 text-xs">{student.class}</div>
                </div>
                
                <div className="bg-gray-100 p-3 flex items-center justify-center relative" style={{ height: '160px' }}>
                  {student.photoPath ? (
                    <PhotoViewer
                      photoPath={student.photoPath}
                      alt={student.name}
                      width={120}
                      height={150}
                      className="h-[150px] w-[120px] object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[150px] w-[120px] bg-gray-200 border border-gray-300 text-gray-400">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {selectedStudent === student.id && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <div className="animate-pulse text-blue-500">Uploading...</div>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-gray-50">
                  <label className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer">
                    <input
                      type="file"
                      className="sr-only"
                      disabled={selectedStudent !== null}
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleIndividualUpload(student.id, file);
                        }
                      }}
                    />
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                      />
                    </svg>
                    Upload Photo
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoManager; 