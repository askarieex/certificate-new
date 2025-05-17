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
$logFile = __DIR__ . '/logs/save-data.log';
if (!file_exists(dirname($logFile))) {
    mkdir(dirname($logFile), 0777, true);
}
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Save data request received\n", FILE_APPEND);

// Get data from POST request
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!$data) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Invalid JSON data received\n", FILE_APPEND);
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid data format'
    ]);
    exit;
}

// Extract username and students data
$username = isset($data['username']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $data['username']) : 'default';
$students = isset($data['students']) ? $data['students'] : [];

if (empty($students) || !is_array($students)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "No students data received\n", FILE_APPEND);
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'No student data to save'
    ]);
    exit;
}

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/../data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Created data directory: $dataDir\n", FILE_APPEND);
}

// Save data to JSON file
$filename = $dataDir . '/' . $username . '_data.json';
$result = file_put_contents($filename, json_encode($students, JSON_PRETTY_PRINT));

if ($result === false) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Error saving data: " . error_get_last()['message'] . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to save data'
    ]);
} else {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Data saved successfully to " . $filename . " (" . count($students) . " students)\n", FILE_APPEND);
    echo json_encode([
        'status' => 'success',
        'message' => 'Data saved successfully',
        'count' => count($students)
    ]);
} 