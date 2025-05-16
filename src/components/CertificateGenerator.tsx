import React, { useState } from 'react';
import { Student } from '../utils/types';
import { createTemplateContent, generateCertificates } from '../utils/certificateUtils';
import { exportToExcel } from '../utils/excelUtils';
import { 
  API_BASE_URL, 
  GENERATE_ENDPOINT, 
  OUTPUT_PATH,
  LOCAL_GENERATE_ENDPOINT
} from '../utils/config';

interface CertificateGeneratorProps {
  students: Student[];
  selectedStudents: string[];
  includePhotos: boolean;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  students,
  selectedStudents,
  includePhotos,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; name: string }>({
    current: 0,
    total: 0,
    name: '',
  });
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Handle template download
  const handleCreateTemplate = () => {
    const templateContent = createTemplateContent();
    
    // Create a blob and download
    const blob = new Blob([templateContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate_template.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle certificate generation
  const handleGenerateCertificates = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student.');
      return;
    }
    
    setIsGenerating(true);
    setShowSuccess(false);
    setProgress({ current: 0, total: selectedStudents.length, name: '' });
    
    try {
      // Get the selected students data
      const selectedStudentsData = students.filter(student => 
        selectedStudents.includes(student.id)
      );
      
      // Try remote PHP server first
      try {
        console.log("Attempting certificate generation via remote server:", GENERATE_ENDPOINT);
        const response = await fetch(GENERATE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            students: selectedStudentsData,
            includePhotos,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && Array.isArray(result.data)) {
            // Use server-generated paths
            const certificatePaths = result.data.map((item: any) => 
              `${API_BASE_URL}${item.pdfPath}`
            );
            setGeneratedFiles(certificatePaths);
            setShowSuccess(true);
            return;
          }
        }
        
        // Remote server failed, try local Next.js API
        console.log("Remote server failed or returned invalid data, trying local API");
        await localGeneration(selectedStudentsData);
      } catch (error) {
        console.log('Remote server error, falling back to local API', error);
        await localGeneration(selectedStudentsData);
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('There was an error generating certificates.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Local API generation
  const localGeneration = async (selectedStudentsData: Student[]) => {
    try {
      // Ensure all student data has DOB values formatted consistently
      const processedStudents = selectedStudentsData.map(student => {
        // Make sure student has all required fields
        return {
          ...student,
          dob: student.dob || '', 
          dobInWords: student.dobInWords || '',
          // Ensure we have valid string values for all required fields
          name: student.name || '',
          fatherName: student.fatherName || '',
          motherName: student.motherName || ''
        };
      });
      
      // Try Next.js local API endpoint
      const localResponse = await fetch(LOCAL_GENERATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: processedStudents,
          includePhotos,
        }),
      });
      
      if (localResponse.ok) {
        const localResult = await localResponse.json();
        console.log("Local API response:", localResult);
        
        if (localResult.status === 'success' && Array.isArray(localResult.data)) {
          // Use locally generated paths
          const certificatePaths = localResult.data.map((item: any) => item.htmlPath);
          setGeneratedFiles(certificatePaths);
          setShowSuccess(true);
          return;
        }
      }
      
      // If local API fails too, fall back to client-side generation
      console.log("Local API failed, falling back to client-side generation");
      await clientSideGeneration(selectedStudentsData);
    } catch (error) {
      console.error('Local API error:', error);
      await clientSideGeneration(selectedStudentsData);
    }
  };
  
  // Client-side generation fallback
  const clientSideGeneration = async (selectedStudentsData: Student[]) => {
    const certificatePaths = await generateCertificates(
      selectedStudentsData,
      includePhotos,
      (current, total, name) => {
        setProgress({ current, total, name });
      }
    );
    
    setGeneratedFiles(certificatePaths);
    setShowSuccess(true);
  };
  
  // Handle Excel export
  const handleExportExcel = () => {
    try {
      exportToExcel(students);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('There was an error exporting to Excel.');
    }
  };
  
  // Handle opening output folder
  const handleOpenOutputFolder = () => {
    window.open(OUTPUT_PATH, '_blank');
  };
  
  // Handle backend fix
  const handleFixBackend = async () => {
    try {
      // Step 1: Check paths
      const checkResponse = await fetch(`${API_BASE_URL}/api/check-paths.php`);
      const checkResult = await checkResponse.json();
      
      console.log("Server path check:", checkResult);
      
      // Step 2: Fix permissions
      const fixResponse = await fetch(`${API_BASE_URL}/api/fix-permissions.php`);
      const fixResult = await fixResponse.json();
      
      console.log("Fix permissions result:", fixResult);
      
      alert("Backend check completed. Check console for details.\n\nOutput directory: " + 
            (checkResult.debug?.output_exists === "Yes" ? "Exists" : "Created") + 
            "\nPermissions: " + checkResult.debug?.output_permissions);
    } catch (error) {
      console.error("Error fixing backend:", error);
      alert("Error fixing backend. Check console for details.");
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Certificate Generation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <button
            onClick={handleCreateTemplate}
            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Create Template
          </button>
        </div>
        
        <div>
          <button
            onClick={handleExportExcel}
            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Save Excel File
          </button>
        </div>
        
        <div>
          <button
            onClick={handleFixBackend}
            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Fix Backend
          </button>
        </div>
      </div>
      
      {isGenerating && (
        <div className="bg-blue-50 rounded-md p-4 mb-6">
          <div className="flex items-center mb-2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Generating: {progress.name} ({progress.current}/{progress.total})
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              {generatedFiles.length} certificates generated successfully!
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const firstFile = generatedFiles[0];
                if (firstFile) {
                  // If it's a local path (not starting with http), add base URL only for remote paths
                  const fullPath = firstFile.startsWith('http') ? firstFile : firstFile.startsWith('/') ? `${window.location.origin}${firstFile}` : firstFile;
                  window.open(fullPath, '_blank');
                }
              }}
              disabled={generatedFiles.length === 0}
              className="px-3 py-1.5 border border-transparent rounded text-xs font-medium bg-white text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Preview First Certificate
            </button>
            
            <button
              onClick={handleOpenOutputFolder}
              className="px-3 py-1.5 border border-transparent rounded text-xs font-medium bg-white text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Open Output Folder
            </button>
            
            <button
              onClick={() => {
                // Show all generated files in a new window
                const win = window.open('', '_blank');
                if (!win) return;
                
                win.document.write(`
                  <html>
                    <head>
                      <title>Generated Certificates</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #2563eb; }
                        ul { list-style-type: none; padding: 0; }
                        li { margin-bottom: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; }
                        a { color: #2563eb; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                      </style>
                    </head>
                    <body>
                      <h1>Generated Certificates</h1>
                      <ul>
                        ${generatedFiles.map((file, index) => {
                          const fileName = file.split('/').pop();
                          const isRemoteFile = file.startsWith('http');
                          const fullPath = isRemoteFile ? file : file.startsWith('/') ? `${window.location.origin}${file}` : file;
                          
                          return `<li>
                            <strong>${index + 1}.</strong> 
                            <a href="${fullPath}" target="_blank">${fileName || file}</a>
                            <small>(${isRemoteFile ? 'Remote' : 'Local'} file)</small>
                          </li>`;
                        }).join('')}
                      </ul>
                    </body>
                  </html>
                `);
                win.document.close();
              }}
              className="px-3 py-1.5 border border-transparent rounded text-xs font-medium bg-white text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All Files
            </button>
            
            <button
              onClick={() => setShowSuccess(false)}
              className="px-3 py-1.5 border border-transparent rounded text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-500 mb-3">
          {selectedStudents.length === 0 ? (
            "No students selected. Please select students from the table."
          ) : (
            `${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} selected for certificate generation`
          )}
        </div>
        
        <button
          onClick={handleGenerateCertificates}
          disabled={selectedStudents.length === 0 || isGenerating}
          className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            "Generating Certificates..."
          ) : (
            "Generate Certificates"
          )}
        </button>
      </div>
    </div>
  );
};

export default CertificateGenerator; 