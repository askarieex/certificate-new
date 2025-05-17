'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '../components/FileUpload';
import StudentTable from '../components/StudentTable';
import StudentEditModal from '../components/StudentEditModal';
import PhotoManager from '../components/PhotoManager';
import CertificateGenerator from '../components/CertificateGenerator';
import ApiDiagnostics from '../components/ApiDiagnostics';
import { Student, AppState } from '../utils/types';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import { exportToExcel } from '../utils/excelUtils';
import { saveStudentsHybrid, loadStudentsHybrid } from '../utils/serverStorage';
import { useAuth } from '../utils/AuthContext';

export default function Home() {
  // Get authentication context
  const { user } = useAuth();

  // Application state with localStorage and server persistence
  const [appState, setAppState] = useState<AppState>(() => {
    // Default state - will be populated from localStorage or server
    return {
      students: [],
      selectedStudents: [],
      includePhotos: true,
      currentPage: 1,
      itemsPerPage: 10,
      searchTerm: '',
    };
  });
  
  // UI state
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Load data from server or localStorage on initial load
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Try to load from server first, then fall back to localStorage
          const students = await loadStudentsHybrid();
          
          setAppState(prevState => ({
            ...prevState,
            students,
          }));
        } catch (error) {
          console.error('Error loading data:', error);
          
          // Try to load from localStorage as fallback
          if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('certificateAppState');
            if (savedState) {
              try {
                const parsedState = JSON.parse(savedState);
                setAppState(prevState => ({
                  ...prevState,
                  ...parsedState,
                }));
              } catch (e) {
                console.error('Failed to parse saved state:', e);
              }
            }
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [user]);
  
  // Save state to localStorage and server whenever students change
  useEffect(() => {
    if (!isLoading && user) {
      const saveData = async () => {
        setSaveStatus('saving');
        try {
          await saveStudentsHybrid(appState.students);
          setSaveStatus('success');
          
          // Reset status after a delay
          setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);
        } catch (error) {
          console.error('Error saving data:', error);
          setSaveStatus('error');
          
          // Reset status after a delay
          setTimeout(() => {
            setSaveStatus('idle');
          }, 5000);
        }
      };
      
      // Use a debounce to avoid too many save operations
      const timeoutId = setTimeout(() => {
        saveData();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [appState.students, isLoading, user]);
  
  // Edit modal state
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Handle file upload
  const handleFileProcessed = (students: Student[]) => {
    setAppState({
      ...appState,
      students,
      selectedStudents: [],
      currentPage: 1,
    });
  };
  
  // Toggle merge mode for file upload
  const handleToggleMergeMode = () => {
    setIsMergeMode(!isMergeMode);
  };
  
  // Clear all student data
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all student data? This cannot be undone.')) {
      setAppState({
        ...appState,
        students: [],
        selectedStudents: [],
        currentPage: 1,
      });
    }
  };
  
  // Handle student selection
  const handleStudentSelect = (id: string, selected: boolean) => {
    if (selected) {
      setAppState({
        ...appState,
        selectedStudents: [...appState.selectedStudents, id],
      });
    } else {
      setAppState({
        ...appState,
        selectedStudents: appState.selectedStudents.filter(studentId => studentId !== id),
      });
    }
  };
  
  // Handle select all students
  const handleSelectAll = (selected: boolean) => {
    // Get all students on the current page
    const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
    const filteredStudents = appState.students.filter(student => {
      if (!appState.searchTerm) return true;
      
      const term = appState.searchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(term) ||
        student.fatherName.toLowerCase().includes(term) ||
        student.motherName.toLowerCase().includes(term) ||
        student.class.toLowerCase().includes(term) ||
        student.dob.toLowerCase().includes(term)
      );
    });
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + appState.itemsPerPage);
    
    if (selected) {
      // Add current page students to selection if not already selected
      const currentPageIds = paginatedStudents.map(s => s.id);
      const newSelectedStudents = [
        ...appState.selectedStudents,
        ...currentPageIds.filter(id => !appState.selectedStudents.includes(id)),
      ];
      setAppState({
        ...appState,
        selectedStudents: newSelectedStudents,
      });
    } else {
      // Remove current page students from selection
      const currentPageIds = paginatedStudents.map(s => s.id);
      const newSelectedStudents = appState.selectedStudents.filter(
        id => !currentPageIds.includes(id)
      );
      setAppState({
        ...appState,
        selectedStudents: newSelectedStudents,
      });
    }
  };
  
  // Handle editing a student
  const handleEditStudent = (student: Student) => {
    setEditStudent(student);
    setIsEditModalOpen(true);
  };
  
  // Handle creating a new student
  const handleAddStudent = () => {
    const newStudent: Student = {
      id: uuidv4(),
      name: '',
      fatherName: '',
      motherName: '',
      dob: '',
      dobInWords: '',
      class: '',
      address: '',
    };
    setEditStudent(newStudent);
    setIsEditModalOpen(true);
  };
  
  // Handle saving a student
  const handleSaveStudent = (student: Student) => {
    const isNew = !appState.students.some(s => s.id === student.id);
    
    if (isNew) {
      // Add new student
      setAppState({
        ...appState,
        students: [...appState.students, student],
      });
    } else {
      // Update existing student
      setAppState({
        ...appState,
        students: appState.students.map(s => 
          s.id === student.id ? student : s
        ),
      });
    }
  };
  
  // Handle deleting selected students
  const handleDeleteSelected = () => {
    if (appState.selectedStudents.length === 0) {
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${appState.selectedStudents.length} student(s)?`)) {
      setAppState({
        ...appState,
        students: appState.students.filter(s => !appState.selectedStudents.includes(s.id)),
        selectedStudents: [],
      });
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setAppState({
      ...appState,
      currentPage: page,
    });
  };
  
  // Handle search
  const handleSearchChange = (term: string) => {
    setAppState({
      ...appState,
      searchTerm: term,
      currentPage: 1, // Reset to first page on search
    });
  };
  
  // Handle photo toggle
  const handlePhotoToggle = (include: boolean) => {
    setAppState({
      ...appState,
      includePhotos: include,
    });
  };
  
  // Handle updating students (e.g. after bulk photo assignment)
  const handleStudentsUpdate = (updatedStudents: Student[]) => {
    setAppState({
      ...appState,
      students: updatedStudents,
    });
  };
  
  // Handle exporting data to Excel
  const handleExportToExcel = () => {
    if (appState.students.length === 0) {
      alert('No data to export');
      return;
    }
    
    try {
      exportToExcel(appState.students);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };
  
  return (
    <ProtectedRoute>
      <Header />
      <main className="min-h-screen bg-gradient-to-r from-blue-900 to-blue-700 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              School DOB Certificate Generator
            </h1>
            <p className="mt-2 text-lg text-blue-100">
              Upload Excel, manage student data, and generate certificates
            </p>
            
            {/* Save status indicator */}
            {saveStatus !== 'idle' && (
              <div className={`mt-2 text-sm inline-flex items-center px-3 py-1 rounded-full ${
                saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' : 
                saveStatus === 'success' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {saveStatus === 'saving' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving data...
                  </>
                )}
                {saveStatus === 'success' && (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Data saved
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Error saving data
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Main content */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
              <span className="ml-4 text-xl text-white">Loading your data...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* File upload section */}
              <div className="bg-white rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  1. Upload Student Excel Data
                </h2>
                <FileUpload 
                  onFileProcessed={handleFileProcessed} 
                  existingStudents={appState.students}
                  isMergeMode={isMergeMode}
                  onToggleMergeMode={handleToggleMergeMode}
                />

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleClearData}
                    className="clear-btn flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Clear All Data
                  </button>
                  <button
                    onClick={handleAddStudent}
                    className="add-btn flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Student
                  </button>
                </div>
              </div>
              
              {/* Student table section */}
              <div className="bg-white rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  2. Manage Student Data
                </h2>
                <div className="mb-4 flex justify-between">
                  <button
                    onClick={handleExportToExcel}
                    disabled={appState.students.length === 0}
                    className={`export-btn flex items-center ${appState.students.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export to Excel
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={appState.selectedStudents.length === 0}
                    className={`delete-btn flex items-center ${appState.selectedStudents.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete Selected ({appState.selectedStudents.length})
                  </button>
                </div>
                <StudentTable 
                  students={appState.students}
                  selectedStudents={appState.selectedStudents}
                  onStudentSelect={handleStudentSelect}
                  onSelectAll={handleSelectAll}
                  onEditStudent={handleEditStudent}
                  currentPage={appState.currentPage}
                  itemsPerPage={appState.itemsPerPage}
                  onPageChange={handlePageChange}
                  searchTerm={appState.searchTerm}
                  onSearchChange={handleSearchChange}
                />
              </div>
              
              {/* Photo manager section */}
              <div className="bg-white rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  3. Manage Photos
                </h2>
                <PhotoManager 
                  students={appState.students}
                  selectedStudents={appState.selectedStudents}
                  onStudentsUpdate={handleStudentsUpdate}
                  includePhotos={appState.includePhotos}
                  onPhotoToggle={handlePhotoToggle}
                />
              </div>
              
              {/* Certificate generator section */}
              <div className="bg-white rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  4. Generate Certificates
                </h2>
                <CertificateGenerator 
                  students={appState.students}
                  selectedStudents={appState.selectedStudents}
                  includePhotos={appState.includePhotos}
                />
              </div>
              
              {/* API Diagnostics */}
              <div className="bg-white rounded-lg shadow-xl p-6">
                <ApiDiagnostics />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Student edit modal */}
      {editStudent && (
        <StudentEditModal
          student={editStudent}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveStudent}
        />
      )}
    </ProtectedRoute>
  );
}
