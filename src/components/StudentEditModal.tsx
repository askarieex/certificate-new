import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Student } from '../utils/types';
import { savePhoto } from '../utils/photoUtils';
import PhotoViewer from './PhotoViewer';

interface StudentEditModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
}

// Helper function to convert date to words
const convertDateToWords = (dateStr: string): string => {
  try {
    // Remove any extra spaces and ensure consistent format
    const cleanDate = dateStr.replace(/\s/g, '').replace(/[\/\\.-]/g, '-');
    const parts = cleanDate.split('-');
    
    if (parts.length !== 3) return '';
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    if (month < 1 || month > 12) return '';
    
    // Convert day number to ordinal text
    const getDayText = (day: number): string => {
      const specialCases: {[key: number]: string} = {
        1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Fifth',
        6: 'Sixth', 7: 'Seventh', 8: 'Eighth', 9: 'Ninth', 10: 'Tenth',
        11: 'Eleventh', 12: 'Twelfth', 13: 'Thirteenth', 14: 'Fourteenth', 15: 'Fifteenth',
        16: 'Sixteenth', 17: 'Seventeenth', 18: 'Eighteenth', 19: 'Nineteenth', 20: 'Twentieth',
        21: 'Twenty-First', 22: 'Twenty-Second', 23: 'Twenty-Third', 24: 'Twenty-Fourth', 
        25: 'Twenty-Fifth', 26: 'Twenty-Sixth', 27: 'Twenty-Seventh', 28: 'Twenty-Eighth',
        29: 'Twenty-Ninth', 30: 'Thirtieth', 31: 'Thirty-First'
      };
      
      return specialCases[day] || day.toString();
    };
    
    // Month names
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Convert year to words
    const yearToWords = (year: number): string => {
      if (year >= 2000) {
        return 'Two Thousand ' + getYearSuffix(year - 2000);
      } else if (year >= 1900) {
        return 'Nineteen Hundred ' + getYearSuffix(year - 1900);
      }
      return year.toString();
    };
    
    const getYearSuffix = (num: number): string => {
      if (num === 0) return '';
      if (num < 10) return singleDigits[num];
      if (num < 20) return teens[num - 10];
      
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      
      if (ones === 0) return tensNames[tens - 2];
      return tensNames[tens - 2] + ' ' + singleDigits[ones];
    };
    
    const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tensNames = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    return `${getDayText(day)} of ${months[month - 1]} ${yearToWords(year)}`;
  } catch (error) {
    console.error("Error converting date to words:", error);
    return '';
  }
};

const StudentEditModal: React.FC<StudentEditModalProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
}) => {
  // Form state
  const [formData, setFormData] = useState<Student>({
    id: '',
    name: '',
    fatherName: '',
    motherName: '',
    dob: '',
    dobInWords: '',
    class: '',
    address: '',
  });
  
  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Initialize form when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        // Ensure optional fields are set
        address: student.address || '',
        class: student.class || '',
      });
      
      // Set photo preview if photo exists
      if (student.photoPath) {
        setPhotoPreview(student.photoPath);
      } else {
        setPhotoPreview('');
      }
    }
  }, [student]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for DOB - auto-generate DOB in words if needed
    if (name === 'dob') {
      const dobValue = value.trim();
      setFormData(prev => {
        // If DOB field has a valid format, generate the words version
        const generatedWords = convertDateToWords(dobValue);
        
        // Only auto-set the DOB in words if it's empty or user hasn't modified it
        const useGeneratedWords = !prev.dobInWords || 
                                 (prev.dob && prev.dobInWords === convertDateToWords(prev.dob));
        
        return {
          ...prev,
          [name]: dobValue,
          // Auto-update dobInWords if it was empty or matches the previous auto-generated value
          ...(useGeneratedWords && generatedWords ? { dobInWords: generatedWords } : {})
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Handle photo drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.gif']
    },
    maxFiles: 1,
    disabled: isUploading
  });
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let photoPath = formData.photoPath;
      
      // Upload photo if a new one was selected
      if (photoFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        photoPath = await savePhoto(photoFile, (progress: number) => {
          setUploadProgress(progress);
        });
        
        setIsUploading(false);
      }
      
      // Call onSave with updated form data
      onSave({
        ...formData,
        photoPath
      });
      
      // Reset state
      setPhotoFile(null);
      setPhotoPreview('');
      setUploadProgress(0);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("There was an error saving the student data. Please try again.");
      setIsUploading(false);
    }
  };
  
  if (!isOpen || !formData) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {student?.id ? 'Edit Student' : 'Add Student'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="col-span-1">
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <input
                type="text"
                id="class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="col-span-1">
              <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1">
                Father's Name
              </label>
              <input
                type="text"
                id="fatherName"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="col-span-1">
              <label htmlFor="motherName" className="block text-sm font-medium text-gray-700 mb-1">
                Mother's Name
              </label>
              <input
                type="text"
                id="motherName"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="col-span-1">
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="DD-MM-YYYY"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: DD-MM-YYYY (e.g., 05-03-2015)</p>
            </div>
            
            <div className="col-span-1">
              <label htmlFor="dobInWords" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth in Words <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="dobInWords"
                name="dobInWords"
                value={formData.dobInWords}
                onChange={handleChange}
                placeholder="Fifth of March Two Thousand Fifteen"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Example: Fifth of March Two Thousand Fifteen</p>
            </div>
            
            <div className="col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Photo
              </label>
              
              <div className="flex items-center space-x-6">
                {/* Photo preview area */}
                <div className="w-32 h-40 border border-gray-300 rounded-md overflow-hidden">
                  {photoPreview ? (
                    <PhotoViewer 
                      photoPath={photoPreview}
                      alt={formData?.name || 'Preview'}
                      width={128}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <svg 
                        className="h-12 w-12 text-gray-400" 
                        stroke="currentColor" 
                        fill="none" 
                        viewBox="0 0 48 48" 
                        aria-hidden="true"
                      >
                        <path 
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                          strokeWidth={2} 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Photo upload dropzone */}
                <div 
                  {...getRootProps()} 
                  className={`
                    flex-1 border-2 border-dashed rounded-md p-4 text-center cursor-pointer
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {isDragActive
                        ? "Drop the photo here..."
                        : "Drag and drop a photo, or click to select"}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEditModal; 