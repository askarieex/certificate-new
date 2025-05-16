<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Load composer dependencies
require __DIR__ . '/vendor/autoload.php';

// Use PhpSpreadsheet
use PhpOffice\PhpSpreadsheet\IOFactory;

// Error handling
try {
    // Check if file was uploaded
    if (!isset($_FILES['excelFile']) || $_FILES['excelFile']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("No file uploaded or upload error.");
    }

    $file = $_FILES['excelFile'];
    $tempPath = $file['tmp_name'];
    
    // Validate file type
    $fileType = IOFactory::identify($tempPath);
    if (!in_array($fileType, ['Xlsx', 'Xls'])) {
        throw new Exception("Invalid file format. Please upload an Excel file (.xlsx or .xls).");
    }
    
    // Read the Excel file
    $reader = IOFactory::createReader($fileType);
    $spreadsheet = $reader->load($tempPath);
    $worksheet = $spreadsheet->getActiveSheet();
    $rows = $worksheet->toArray();
    
    // Skip header row
    $headers = array_shift($rows);
    
    // Process data
    $students = [];
    foreach ($rows as $row) {
        $student = [];
        foreach ($headers as $index => $header) {
            $header = strtolower(trim($header));
            $value = isset($row[$index]) ? trim($row[$index]) : '';
            
            // Handle common header names
            if (strpos($header, 'name') !== false && strpos($header, 'father') === false && strpos($header, 'mother') === false) {
                $student['name'] = $value;
            } elseif (strpos($header, 'father') !== false) {
                $student['fatherName'] = $value;
            } elseif (strpos($header, 'mother') !== false) {
                $student['motherName'] = $value;
            } elseif (strpos($header, 'dob') !== false && strpos($header, 'word') === false) {
                // Handle date formatting
                if ($value) {
                    try {
                        $date = new DateTime($value);
                        $student['dob'] = $date->format('d / m / Y');
                    } catch (Exception $e) {
                        $student['dob'] = $value;
                    }
                } else {
                    $student['dob'] = '';
                }
            } elseif ((strpos($header, 'dob') !== false || strpos($header, 'date') !== false) && strpos($header, 'word') !== false) {
                $student['dobInWords'] = $value;
            } elseif (strpos($header, 'class') !== false) {
                $student['class'] = $value;
            } elseif (strpos($header, 'address') !== false) {
                $student['address'] = $value;
            } elseif (strpos($header, 'photo') !== false) {
                $student['photoPath'] = $value;
            }
        }
        
        // Generate a unique ID for each student
        $student['id'] = uniqid();
        
        // Ensure required fields are present
        $requiredFields = ['name', 'fatherName', 'motherName', 'dob', 'dobInWords', 'class', 'address'];
        foreach ($requiredFields as $field) {
            if (!isset($student[$field])) {
                $student[$field] = '';
            }
        }
        
        $students[] = $student;
    }
    
    // Return successful response
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'File processed successfully',
        'data' => $students
    ]);
    
} catch (Exception $e) {
    // Return error response
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} 