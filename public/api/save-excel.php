<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log file for debugging
$logFile = __DIR__ . '/logs/save-excel.log';
if (!file_exists(dirname($logFile))) {
    mkdir(dirname($logFile), 0777, true);
}
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Save Excel request received\n", FILE_APPEND);

// Check if file was uploaded
if (!isset($_FILES['excelFile']) || $_FILES['excelFile']['error'] !== UPLOAD_ERR_OK) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "No file uploaded or upload error\n", FILE_APPEND);
    if (isset($_FILES['excelFile'])) {
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Upload error code: " . $_FILES['excelFile']['error'] . "\n", FILE_APPEND);
    }
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'No file uploaded or upload error'
    ]);
    exit;
}

// Get username
$username = isset($_POST['username']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['username']) : 'default';
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Username: " . $username . "\n", FILE_APPEND);

// Create excel directory if it doesn't exist
$excelDir = __DIR__ . '/../excel';
if (!file_exists($excelDir)) {
    mkdir($excelDir, 0777, true);
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Created excel directory: $excelDir\n", FILE_APPEND);
}

// Create user directory
$userDir = $excelDir . '/' . $username;
if (!file_exists($userDir)) {
    mkdir($userDir, 0777, true);
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Created user directory: $userDir\n", FILE_APPEND);
}

// Generate unique filename
$originalName = $_FILES['excelFile']['name'];
$extension = pathinfo($originalName, PATHINFO_EXTENSION);
$timestamp = date('Ymd_His');
$filename = $username . '_' . $timestamp . '.' . $extension;
$filepath = $userDir . '/' . $filename;

// Save the uploaded file
if (move_uploaded_file($_FILES['excelFile']['tmp_name'], $filepath)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Excel file saved successfully to " . $filepath . "\n", FILE_APPEND);
    
    // Save file info to user's manifest
    $manifestFile = $userDir . '/manifest.json';
    $manifest = [];
    
    if (file_exists($manifestFile)) {
        $manifestContent = file_get_contents($manifestFile);
        if ($manifestContent !== false) {
            $manifest = json_decode($manifestContent, true) ?: [];
        }
    }
    
    // Add new file to manifest
    $manifest[] = [
        'filename' => $filename,
        'originalName' => $originalName,
        'timestamp' => time(),
        'date' => date('Y-m-d H:i:s'),
        'size' => $_FILES['excelFile']['size']
    ];
    
    // Save manifest
    file_put_contents($manifestFile, json_encode($manifest, JSON_PRETTY_PRINT));
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Excel file saved successfully',
        'filename' => $filename,
        'filepath' => '/excel/' . $username . '/' . $filename
    ]);
} else {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Failed to save Excel file\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to save Excel file'
    ]);
} 