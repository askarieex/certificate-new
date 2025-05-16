/**
 * Type definitions for the application
 */

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string; // Date of birth in DD/MM/YYYY format
  dobInWords: string;
  rollNumber?: string;
  photoPath?: string; // Path to student photo
  address?: string;
  class?: string;
  section?: string;
  admissionNumber?: string;
}

export interface AppState {
  students: Student[];
  selectedStudents: string[];
  includePhotos: boolean;
  currentPage: number;
  itemsPerPage: number;
  searchTerm: string;
}

export interface GenerateResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    htmlPath: string;
    pdfPath?: string;
  }[];
}

export interface UploadResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    path: string;
    url: string;
  };
}

export interface ServerDebugInfo {
  output_exists: 'Yes' | 'No';
  output_permissions: string;
  php_version: string;
  memory_limit: string;
  post_max_size: string;
  upload_max_filesize: string;
}

export interface ServerCheckResponse {
  status: 'success' | 'error';
  message: string;
  debug?: ServerDebugInfo;
} 