import { Student } from './types';
import { API_BASE_URL } from './config';
import { logger } from './loggingUtils';
import { getFullUrl } from './environmentUtils';
import { saveFile } from './fileUtils';

// Create a separate function for getting download scripts to avoid template string issues
const getDownloadScripts = (): string => {
  return `
    function downloadAsPDF() {
      alert('Preparing PDF download...');
      window.print();
    }
    
    function downloadAsWord() {
      alert('Preparing Word document...');
      const fileName = 'DOB_Certificate.doc';
      
      const link = document.createElement('a');
      link.href = 'data:application/msword;charset=utf-8,' + encodeURIComponent(document.documentElement.outerHTML);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    function printCertificate() {
      const downloadOptions = document.querySelector('.download-options');
      if (downloadOptions) {
        downloadOptions.style.display = 'none';
      }
      
      window.print();
      
      setTimeout(() => {
        if (downloadOptions) {
          downloadOptions.style.display = 'flex';
        }
      }, 1000);
    }
  `;
};

/**
 * Create a standard certificate template with placeholders
 */
export const createTemplateContent = (): string => {
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Date of Birth Certificate</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
        
        :root {
            --primary-color: #1a366d;
            --secondary-color: #a92535;
            --accent-color: #d7a03e;
            --border-color: #1a366d;
            --background-color: #f9fafb;
            --text-color: #2d3748;
            --light-color: #f3f4f6;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Montserrat', sans-serif;
            line-height: 1.8;
            background: var(--background-color);
            margin: 0;
            padding: 20px;
            color: var(--text-color);
        }
        
        .certificate-container {
            max-width: 210mm;
            margin: 0 auto;
        }
        
        .certificate {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 20mm 15mm;
            background: white;
            border: 1px solid #333;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
            page-break-after: always;
        }
        
        .certificate-inner {
            position: relative;
            padding: 20px 30px;
            height: calc(100% - 40px);
            background: white;
            border: 8px double;
            border-image: linear-gradient(45deg, var(--accent-color), var(--primary-color)) 1;
        }
        
        .certificate-inner::before {
            content: none;
        }
        
        .watermark {
            display: none;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
            padding-bottom: 15px;
        }
        
        .office-title {
            font-size: 16px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 500;
            color: var(--primary-color);
            margin-bottom: 5px;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        
        .school-name {
            font-size: 36px;
            font-weight: 700;
            font-family: 'Cormorant Garamond', serif;
            color: var(--secondary-color);
            text-transform: uppercase;
            margin: 10px 0;
            letter-spacing: 2px;
            line-height: 1.2;
            text-shadow: none;
        }
        
        .decorative-line {
            width: 100%;
            height: 1px;
            background: #000000;
            margin: 15px auto 0;
        }
        
        .decorative-symbol {
            font-size: 28px;
            color: var(--primary-color);
            margin: 0 10px;
            opacity: 0.7;
        }
        
        .student-photo-container {
            float: right;
            width: 130px;
            height: 150px;
            margin-left: 20px;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
            border: 1px solid var(--accent-color);
        }
        
        .student-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
            background-color: #f5f5f5;
        }
        
        .student-photo::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 1px solid rgba(0,0,0,0.1);
            z-index: 2;
        }
        
        .content {
            margin-top: 40px;
            position: relative;
            z-index: 1;
        }
        
        .to-whom {
            font-weight: 700;
            text-align: center;
            margin-bottom: 40px;
            font-size: 24px;
            font-family: 'Cormorant Garamond', serif;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: var(--primary-color);
            position: relative;
        }
        
        .to-whom::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 1px;
            background: var(--accent-color);
        }
        
        .decorative-element {
            position: absolute;
            left: 0;
            bottom: 20px;
            width: 150px;
            height: 150px;
            background-image: radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%);
            border-left: 2px solid rgba(245, 158, 11, 0.2);
            border-bottom: 2px solid rgba(245, 158, 11, 0.2);
            border-bottom-left-radius: 150px;
            z-index: 0;
        }
        
        .certificate-text {
            text-align: justify;
            font-size: 16px;
            line-height: 2;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
        }
        
        .certificate-text p {
            margin-bottom: 20px;
        }
        
        .highlight {
            font-weight: 600;
            color: var(--primary-color);
            text-decoration: underline;
            text-decoration-color: var(--accent-color);
            text-decoration-thickness: 1px;
            text-underline-offset: 3px;
            padding-bottom: 0;
            display: inline-block;
            border-bottom: none;
        }
        
        .editable-field {
            font-weight: 600;
            color: var(--primary-color);
            text-decoration: underline;
            text-decoration-color: var(--accent-color);
            text-decoration-thickness: 1px;
            text-underline-offset: 3px;
            padding-bottom: 0;
            display: inline-block;
            border-bottom: none;
            min-width: 100px;
            outline: none;
            cursor: text;
        }
        
        .dob-section {
            margin: 15px 0;
            padding: 0 0 0 15px;
            border-left: 2px solid var(--accent-color);
        }
        
        .signature-section {
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
            margin-top: 60px;
            position: relative;
            z-index: 1;
        }
        
        .signature {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 200px;
            padding: 15px 10px 5px;
            position: relative;
            z-index: 2;
        }
        
        .signature-image {
            width: 150px;
            height: 40px;
            border-bottom: 1px dashed var(--primary-color);
            margin-bottom: 10px;
        }
        
        .signature-line {
            width: 180px;
            border-top: 1px solid var(--primary-color);
            margin-top: 30px;
            padding-top: 8px;
            font-weight: 700;
            font-size: 16px;
            font-family: 'Cormorant Garamond', serif;
            text-align: center;
            color: var(--primary-color);
        }
        
        .date {
            position: absolute;
            bottom: 40px;
            left: 0;
            font-weight: 500;
            font-size: 14px;
        }
        
        .date-label {
            font-weight: 600;
            color: var(--primary-color);
        }
        
        .certificate-id {
            display: none; /* Hide certificate ID completely */
        }
        
        .border-decoration {
            position: absolute;
            width: 50px;
            height: 50px;
            pointer-events: none;
            z-index: 2;
        }
        
        .border-decoration.top-left {
            top: 20px;
            left: 20px;
            border-top: 3px solid var(--accent-color);
            border-left: 3px solid var(--accent-color);
        }
        
        .border-decoration.top-right {
            top: 20px;
            right: 20px;
            border-top: 3px solid var(--accent-color);
            border-right: 3px solid var(--accent-color);
        }
        
        .border-decoration.bottom-left {
            bottom: 20px;
            left: 20px;
            border-bottom: 3px solid var(--accent-color);
            border-left: 3px solid var(--accent-color);
        }
        
        .border-decoration.bottom-right {
            bottom: 20px;
            right: 20px;
            border-bottom: 3px solid var(--accent-color);
            border-right: 3px solid var(--accent-color);
        }
        
        .download-options {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .download-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 20px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            width: 180px;
        }
        
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .download-btn.pdf {
            background-color: #b23850;
        }
        
        .download-btn.pdf:hover {
            background-color: #9e3045;
        }
        
        .download-btn.word {
            background-color: #2a4d69;
        }
        
        .download-btn.word:hover {
            background-color: #234260;
        }
        
        .download-btn.print {
            background-color: #4b5563;
        }
        
        .download-btn.print:hover {
            background-color: #374151;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 0;
            }
            
            html, body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
                background: white;
            }
            
            .certificate-container {
                max-width: none;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
            
            .certificate {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 15mm;
                border: none;
                box-shadow: none;
                border-image: none;
            }
            
            .download-options {
                display: none;
            }
            
            .editable-field {
                border: none;
                outline: none;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate">
            <div class="certificate-inner">
                <!-- Corner decorations -->
                <div class="border-decoration top-left" style="display:none;"></div>
                <div class="border-decoration top-right" style="display:none;"></div>
                <div class="border-decoration bottom-left" style="display:none;"></div>
                <div class="border-decoration bottom-right" style="display:none;"></div>
                
                <!-- Watermark -->
                <div class="watermark" style="display:none;">CERTIFICATE</div>
                
                <!-- Header -->
                <div class="header">
                    <div class="office-title" contenteditable="true">OFFICE OF THE HEADMASTER</div>
                    <div class="school-name" contenteditable="true">GOVT.MIDDLE SCHOOL</div>
                    <div class="school-name" style="font-size: 28px; margin-top: -5px;" contenteditable="true">SHIGANPORA-A</div>
                    <div class="decorative-line"></div>
                </div>
                
                <!-- Title -->
                <div class="to-whom" contenteditable="true">TO WHOM IT MAY CONCERN</div>
                
                <!-- Main content -->
                <div class="content">
                    <!-- Student photo if included -->
                    <div class="student-photo-container" id="photoContainer" style="display: PHOTO_DISPLAY;">
                        <img src="PHOTO_PATH" alt="Student Photo" class="student-photo" id="studentPhoto">
                    </div>
                    
                    <div class="certificate-text">
                        <p>It is certified that <span class="highlight" contenteditable="true">STUDENT_NAME</span> son/daughter of <span class="highlight" contenteditable="true">FATHER_NAME</span> and <span class="highlight" contenteditable="true">MOTHER_NAME</span>, R/O <span class="highlight" contenteditable="true">RESIDENCE_ADDRESS</span> is/was reading in our institute. His/her date of birth as per our school records is:</p>
                        
                        <div class="dob-section">
                            <p>In numbers: <span class="highlight" contenteditable="true">DOB_VALUE</span></p>
                            <p>In words: <span class="highlight" contenteditable="true">DOB_WORDS</span></p>
                        </div>
                        
                        <p contenteditable="true">Hence, Date of birth certificate is being issued in his/her favor.</p>
                    </div>
                    
                    <!-- Signature section -->
                    <div class="signature-section">
                        <div class="decorative-element"></div>
                        <div class="signature">
                            <div class="signature-image"></div>
                            <div class="signature-line" contenteditable="true">Headmaster</div>
                        </div>
                        
                        <!-- Date -->
                        <div class="date">
                            <span class="date-label">Dated:</span> <span contenteditable="true">CURRENT_DATE</span>
                        </div>
                    </div>
                    
                    <!-- Certificate ID -->
                    <!-- <div class="certificate-id">
                        <span class="certificate-id-label">Certificate ID:</span> CERTIFICATE_ID
                    </div> -->
                </div>
            </div>
        </div>
        
        <div class="download-options">
            <button onclick="printCertificate()" class="download-btn print">Print Certificate (A4)</button>
            <button onclick="downloadAsPDF()" class="download-btn pdf">Download PDF</button>
            <button onclick="downloadAsWord()" class="download-btn word">Download Word</button>
            <button onclick="makeEditable()" class="download-btn word" style="background-color: #6B7280;">Edit Certificate</button>
        </div>
    </div>

    <script>${getDownloadScripts()}</script>
    <script>
    function makeEditable() {
      // Make all highlighted elements editable
      document.querySelectorAll('.highlight, .editable-field').forEach(el => {
        el.contentEditable = "true";
        el.style.border = "1px dashed #3B82F6";
        el.style.padding = "0 5px";
        el.classList.add('editable-active');
      });
      
      // Show an editing helper message
      const helper = document.createElement('div');
      helper.style.position = "fixed";
      helper.style.bottom = "20px";
      helper.style.left = "20px";
      helper.style.padding = "10px 15px";
      helper.style.backgroundColor = "#2563EB";
      helper.style.color = "white";
      helper.style.borderRadius = "5px";
      helper.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
      helper.style.zIndex = "9999";
      helper.innerHTML = "Certificate is now editable. Click on highlighted fields to edit.";
      document.body.appendChild(helper);
      
      // Remove helper after 5 seconds
      setTimeout(() => {
        helper.style.opacity = "0";
        helper.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          document.body.removeChild(helper);
        }, 500);
      }, 5000);
    }
    </script>
</body>
</html>`;

  return template;
};

/**
 * Generate certificate HTML for a student
 */
export const generateCertificateHtml = (student: Student, includePhotos: boolean): string => {
  // Start with the template
  let template = createTemplateContent();
  
  // Format DOB if needed
  let formattedDob = student.dob || '';
  // Remove slashes and extra spaces if present
  formattedDob = formattedDob.replace(/\s*\/\s*/g, '-').trim();
  
  // Default DOB in words if not provided
  let dobInWords = student.dobInWords || '';
  if (!dobInWords && formattedDob) {
    // Try to create a simple words version if not provided
    try {
      const dateParts = formattedDob.split(/[-\/]/);
      if (dateParts.length === 3) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
          dobInWords = `${day} of ${months[month-1]} ${year}`;
        }
      }
    } catch (err) {
      console.error('Error formatting DOB in words:', err);
    }
  }
  
  // Get residence/address info or provide a placeholder
  const residenceAddress = student.address || 'Enter address here';
  
  // Replace placeholders
  template = template.replace(/STUDENT_NAME/g, student.name || '');
  template = template.replace(/FATHER_NAME/g, student.fatherName || '');
  template = template.replace(/MOTHER_NAME/g, student.motherName || '');
  template = template.replace(/RESIDENCE_ADDRESS/g, residenceAddress);
  template = template.replace(/DOB_VALUE/g, formattedDob);
  template = template.replace(/DOB_WORDS/g, dobInWords);
  template = template.replace(/CURRENT_DATE/g, new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }));
  
  // Insert photo if available and requested
  if (includePhotos && student.photoPath) {
    const validPhotoPath = student.photoPath.startsWith('http') 
      ? student.photoPath 
      : getFullUrl(student.photoPath);
        
    console.log('Using photo path:', validPhotoPath);
    
    // Set photo path and display
    template = template.replace(/PHOTO_PATH/g, validPhotoPath);
    template = template.replace(/PHOTO_DISPLAY/g, 'block');
  } else {
    // No photo or photos not included - hide the container
    template = template.replace(/PHOTO_DISPLAY/g, 'none');
    template = template.replace(/PHOTO_PATH/g, '');
  }
  
  return template;
};

/**
 * Generate certificates for multiple students
 */
export const generateCertificates = async (
  students: Student[],
  includePhotos: boolean,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<string[]> => {
  try {
    const results: string[] = [];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Generate HTML content
      const htmlContent = generateCertificateHtml(student, includePhotos);
      
      // Create file names
      const safeName = student.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const fileName = `${safeName}_certificate.html`;
      
      // Create output path (relative, not starting with slash)
      const outputPath = `output/${fileName}`;
      
      // Check if we're in a static build environment
      if (process.env.NEXT_PUBLIC_IS_STATIC === 'true') {
        // For static sites, save the content to localStorage
        await saveFile(outputPath, htmlContent);
      } else {
        // In development, you might have server-side file saving
        // This would be replaced with your actual file saving logic
        console.log('Would save file to server at', outputPath);
      }
      
      // Add to results
      results.push(outputPath);
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, students.length, student.name);
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Error generating certificates:', error);
    throw error;
  }
}; 