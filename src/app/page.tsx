'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '../components/FileUpload';
import StudentTable from '../components/StudentTable';
import StudentEditModal from '../components/StudentEditModal';
import PhotoManager from '../components/PhotoManager';
import CertificateGenerator from '../components/CertificateGenerator';
import ApiDiagnostics from '../components/ApiDiagnostics';
import { Student, AppState } from '../utils/types';

export default function Home() {
  // Application state
  const [appState, setAppState] = useState<AppState>({
    students: [],
    selectedStudents: [],
    includePhotos: true,
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
  });
  
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
  
  return (
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
        </div>
        
        {/* Main content */}
        <div className="space-y-8">
          {/* File upload section */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              1. Upload Student Excel Data
            </h2>
            <FileUpload onFileProcessed={handleFileProcessed} />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddStudent}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add New Student
              </button>
            </div>
          </div>
          
          {/* Data management section */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              2. Manage Student Data
            </h2>
            
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
          
          {/* Photo management section */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              3. Manage Photos
            </h2>
            
            <PhotoManager
              students={appState.students}
              selectedStudents={appState.selectedStudents}
              includePhotos={appState.includePhotos}
              onPhotoToggle={handlePhotoToggle}
              onStudentsUpdate={handleStudentsUpdate}
            />
          </div>
          
          {/* Certificate generation section */}
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
        </div>
      </div>
      
      {/* Student edit modal */}
      <StudentEditModal
        student={editStudent}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveStudent}
      />
      
      <ApiDiagnostics />
    </main>
  );
}
