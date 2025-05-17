<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log file for debugging
$logFile = __DIR__ . '/logs/delete-excel.log';
if (!file_exists(dirname($logFile))) {
    mkdir(dirname($logFile), 0777, true);
}
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Delete Excel file request received\n", FILE_APPEND);

// Get input data
$userData = json_decode(file_get_contents('php://input'), true);

// Check for required data
if (!isset($userData['username']) || !isset($userData['filename'])) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Missing username or filename\n", FILE_APPEND);
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Username and filename are required'
    ]);
    exit;
}

// Get username and filename (with basic sanitization)
$username = preg_replace('/[^a-zA-Z0-9_-]/', '', $userData['username']);
$filename = basename($userData['filename']); // Only allow the filename, no path traversal

file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Username: " . $username . ", Filename: " . $filename . "\n", FILE_APPEND);

// Path to user's excel directory
$userDir = __DIR__ . '/../excel/' . $username;
$filePath = $userDir . '/' . $filename;

// Check if file exists and is in the correct directory
if (!file_exists($userDir)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "User directory not found: " . $userDir . "\n", FILE_APPEND);
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'User directory not found'
    ]);
    exit;
}

if (!file_exists($filePath)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "File not found: " . $filePath . "\n", FILE_APPEND);
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'File not found'
    ]);
    exit;
}

// Extra security check: make sure the file is within the user's directory
$realFilePath = realpath($filePath);
$realUserDir = realpath($userDir);

if (strpos($realFilePath, $realUserDir) !== 0) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Security violation: File is outside user directory\n", FILE_APPEND);
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Access denied'
    ]);
    exit;
}

// Try to delete the file
if (unlink($filePath)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "File deleted successfully: " . $filePath . "\n", FILE_APPEND);
    
    // Update the manifest file
    $manifestFile = $userDir . '/manifest.json';
    if (file_exists($manifestFile)) {
        $manifest = json_decode(file_get_contents($manifestFile), true);
        if (is_array($manifest)) {
            // Filter out the deleted file
            $manifest = array_filter($manifest, function($item) use ($filename) {
                return $item['filename'] !== $filename;
            });
            
            // Re-index array
            $manifest = array_values($manifest);
            
            // Save updated manifest
            file_put_contents($manifestFile, json_encode($manifest, JSON_PRETTY_PRINT));
            file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Manifest updated\n", FILE_APPEND);
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'File deleted successfully'
    ]);
} else {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Failed to delete file: " . $filePath . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to delete file'
    ]);
} 