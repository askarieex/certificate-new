<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Log file for debugging
$logFile = __DIR__ . '/logs/get-excel-files.log';
if (!file_exists(dirname($logFile))) {
    mkdir(dirname($logFile), 0777, true);
}
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Get Excel files request received\n", FILE_APPEND);

// Get username from the request
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $username = isset($_GET['username']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['username']) : 'default';
} else {
    $userData = json_decode(file_get_contents('php://input'), true);
    $username = isset($userData['username']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $userData['username']) : 'default';
}

file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Username: " . $username . "\n", FILE_APPEND);

// Path to user's excel directory
$userDir = __DIR__ . '/../excel/' . $username;
$manifestFile = $userDir . '/manifest.json';

// Check if user directory exists
if (!file_exists($userDir)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "User directory not found: " . $userDir . "\n", FILE_APPEND);
    echo json_encode([
        'status' => 'success', // Still return success to avoid errors, just with empty files array
        'message' => 'No Excel files found for this user',
        'files' => []
    ]);
    exit;
}

// Check if manifest file exists
if (file_exists($manifestFile)) {
    // Read from manifest file (it contains more detailed information)
    $manifestContent = file_get_contents($manifestFile);
    if ($manifestContent === false) {
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Error reading manifest file\n", FILE_APPEND);
        echo json_encode([
            'status' => 'error',
            'message' => 'Error reading manifest file',
            'files' => []
        ]);
        exit;
    }
    
    $files = json_decode($manifestContent, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Error parsing manifest JSON: " . json_last_error_msg() . "\n", FILE_APPEND);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid manifest format',
            'files' => []
        ]);
        exit;
    }
    
    // Verify files still exist and add URLs
    $verifiedFiles = [];
    foreach ($files as $file) {
        $filePath = $userDir . '/' . $file['filename'];
        if (file_exists($filePath)) {
            // Add public URL
            $publicUrl = '/excel/' . $username . '/' . $file['filename'];
            $file['url'] = $publicUrl;
            $verifiedFiles[] = $file;
        }
    }
    
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . count($verifiedFiles) . " Excel files found\n", FILE_APPEND);
    echo json_encode([
        'status' => 'success',
        'message' => 'Excel files retrieved',
        'files' => $verifiedFiles
    ]);
} else {
    // If no manifest exists, scan the directory
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "No manifest file found, scanning directory\n", FILE_APPEND);
    $files = [];
    
    // Get all Excel files in the directory
    $excelFiles = glob($userDir . '/*.{xls,xlsx}', GLOB_BRACE);
    foreach ($excelFiles as $excelFile) {
        $filename = basename($excelFile);
        $files[] = [
            'filename' => $filename,
            'originalName' => $filename,
            'timestamp' => filemtime($excelFile),
            'date' => date('Y-m-d H:i:s', filemtime($excelFile)),
            'size' => filesize($excelFile),
            'url' => '/excel/' . $username . '/' . $filename
        ];
    }
    
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . count($files) . " Excel files found via directory scan\n", FILE_APPEND);
    echo json_encode([
        'status' => 'success',
        'message' => 'Excel files retrieved (from scan)',
        'files' => $files
    ]);
} 