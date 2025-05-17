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
$logFile = __DIR__ . '/logs/clear-excel-files.log';
if (!file_exists(dirname($logFile))) {
    mkdir(dirname($logFile), 0777, true);
}
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Clear Excel files request received\n", FILE_APPEND);

// Get input data
$userData = json_decode(file_get_contents('php://input'), true);

// Check for required data
if (!isset($userData['username'])) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Missing username\n", FILE_APPEND);
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Username is required'
    ]);
    exit;
}

// Get username (with basic sanitization)
$username = preg_replace('/[^a-zA-Z0-9_-]/', '', $userData['username']);
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Username: " . $username . "\n", FILE_APPEND);

// Path to user's excel directory
$userDir = __DIR__ . '/../excel/' . $username;

// Check if user directory exists
if (!file_exists($userDir)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "User directory not found: " . $userDir . "\n", FILE_APPEND);
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'User directory not found'
    ]);
    exit;
}

// Get all Excel files in the directory
$excelFiles = glob($userDir . '/*.{xls,xlsx}', GLOB_BRACE);
$deleteCount = 0;
$failedFiles = [];

// Delete each file
foreach ($excelFiles as $file) {
    if (unlink($file)) {
        $deleteCount++;
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Deleted file: " . basename($file) . "\n", FILE_APPEND);
    } else {
        $failedFiles[] = basename($file);
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Failed to delete file: " . basename($file) . "\n", FILE_APPEND);
    }
}

// Clear the manifest file
$manifestFile = $userDir . '/manifest.json';
if (file_exists($manifestFile)) {
    file_put_contents($manifestFile, json_encode([], JSON_PRETTY_PRINT));
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Manifest cleared\n", FILE_APPEND);
}

// Return result
if (empty($failedFiles)) {
    echo json_encode([
        'status' => 'success',
        'message' => $deleteCount . ' files deleted successfully',
        'deletedCount' => $deleteCount
    ]);
} else {
    http_response_code(207); // Multi-Status
    echo json_encode([
        'status' => 'partial',
        'message' => $deleteCount . ' files deleted, ' . count($failedFiles) . ' files failed to delete',
        'deletedCount' => $deleteCount,
        'failedFiles' => $failedFiles
    ]);
} 