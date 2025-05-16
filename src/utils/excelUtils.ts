import * as XLSX from 'xlsx';
import { Student } from './types';
import { v4 as uuidv4 } from 'uuid';

// Function to normalize dates into a standard format (DD-MM-YYYY)
export const normalizeDate = (dateString: string | number): string => {
  if (!dateString) return '';
  
  // If it's a number (Excel serial date)
  if (typeof dateString === 'number') {
    try {
      // Convert Excel date serial to JavaScript Date
      // Excel dates are the number of days since 1/1/1900
      // Add 25569 to adjust for the difference between 1/1/1900 and 1/1/1970 (UTC)
      const date = new Date((dateString - 25569) * 86400 * 1000);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch (e) {
      return String(dateString);
    }
  }
  
  // If it's already a string
  let cleanDate = String(dateString).trim();
  
  // Handle different date formats
  // Try to determine if it's MM/DD/YYYY, DD/MM/YYYY, or YYYY/MM/DD
  if (/^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$/.test(cleanDate)) {
    // It's likely DD/MM/YYYY or MM/DD/YYYY
    const parts = cleanDate.split(/[.\/-]/);
    // Standard format: DD-MM-YYYY
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  } else if (/^\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2}$/.test(cleanDate)) {
    // It's likely YYYY/MM/DD
    const parts = cleanDate.split(/[.\/-]/);
    // Convert to DD-MM-YYYY
    return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
  }
  
  // Return as-is if we can't parse it
  return cleanDate;
};

// Function to parse Excel file and return structured student data
export const parseExcelFile = async (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Failed to read file');
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON
        const rawRows = XLSX.utils.sheet_to_json(worksheet);
        console.log('Raw Excel data:', rawRows);
        
        // Process rows
        const students: Student[] = rawRows.map((row: any) => {
          console.log('Processing row:', row);
          
          // Auto-detect columns based on their headers
          const nameKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('name') && 
            !k.toLowerCase().includes('father') && 
            !k.toLowerCase().includes('mother')
          ) || 'Name';
          
          const fatherKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('father')
          ) || "Father's Name";
          
          const motherKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('mother')
          ) || "Mother's Name";
          
          // Look for DOB with different possible names
          const dobKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('dob') || 
            k.toLowerCase().includes('date of birth') ||
            k.toLowerCase().includes('birth date') ||
            k.toLowerCase() === 'd.o.b' ||
            k.toLowerCase() === 'date'
          ) || 'DOB';
          
          // Look for DOB in Words with different possible names
          const dobWordsKey = Object.keys(row).find(k => 
            (k.toLowerCase().includes('dob') || 
             k.toLowerCase().includes('date')) && 
            k.toLowerCase().includes('word')
          ) || 'DOB in Words';
          
          const classKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('class') || 
            k.toLowerCase().includes('grade')
          ) || 'Class';
          
          const addressKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('address')
          ) || 'Address';
          
          const photoPathKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('photo')
          );
          
          // Extract DOB values and ensure they're formatted properly
          let dob = row[dobKey] || '';
          let dobInWords = row[dobWordsKey] || '';
          
          // Handle number values that Excel might provide
          if (typeof dob === 'number') {
            dob = normalizeDate(dob);
          }
          
          // If we have a date but no words version, try to generate one
          if (dob && !dobInWords) {
            try {
              const dateParts = String(dob).split(/[-\/\.]/);
              if (dateParts.length === 3) {
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                                'July', 'August', 'September', 'October', 'November', 'December'];
                
                // Try to parse using different formats
                let day, month, year;
                
                // Try DD-MM-YYYY format
                day = parseInt(dateParts[0], 10);
                month = parseInt(dateParts[1], 10);
                year = parseInt(dateParts[2], 10);
                
                if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
                  dobInWords = `${day} of ${months[month-1]} ${year}`;
                }
              }
            } catch (err) {
              console.warn('Failed to generate DOB in words:', err);
            }
          }
          
          console.log(`Extracted DOB: ${dob}, DOB in Words: ${dobInWords}`);

          return {
            id: uuidv4(),
            name: row[nameKey] || '',
            fatherName: row[fatherKey] || '',
            motherName: row[motherKey] || '',
            dob: normalizeDate(row[dobKey] || ''),
            dobInWords: dobInWords,
            class: row[classKey] || '',
            address: row[addressKey] || '',
            photoPath: photoPathKey ? row[photoPathKey] : undefined
          };
        });
        
        // Add debug info
        console.log(`Processed ${students.length} students with fields:`);
        if (students.length > 0) {
          console.log('Sample student:', students[0]);
        }
        
        resolve(students);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        reject(err);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file'));
    };
    
    reader.readAsBinaryString(file);
  });
};

// Export data back to Excel file
export const exportToExcel = (students: Student[]): void => {
  const worksheet = XLSX.utils.json_to_sheet(students.map(student => ({
    'Name': student.name,
    'Father\'s Name': student.fatherName,
    'Mother\'s Name': student.motherName,
    'DOB': student.dob,
    'DOB in Words': student.dobInWords,
    'Class': student.class,
    'Address': student.address,
    'Photo Path': student.photoPath || ''
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  XLSX.writeFile(workbook, 'students_data.xlsx');
}; 