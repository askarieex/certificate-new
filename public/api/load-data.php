<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Log file for debugging
$logFile = __DIR__ . '/logs/load-data.log';
if (!file_exists(dirname($logFile))) {
    mkdir(dirname($logFile), 0777, true);
}
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Load data request received\n", FILE_APPEND);

// Get username from request
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $username = isset($_GET['username']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['username']) : 'default';
} else {
    $userData = json_decode(file_get_contents('php://input'), true);
    $username = isset($userData['username']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $userData['username']) : 'default';
}

file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Username: " . $username . "\n", FILE_APPEND);

// Set up data directory
$dataDir = __DIR__ . '/../data';
$filename = $dataDir . '/' . $username . '_data.json';

if (!file_exists($filename)) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Data file not found: " . $filename . "\n", FILE_APPEND);
    echo json_encode([
        'status' => 'error',
        'message' => 'No data found for this user',
        'data' => []
    ]);
    exit;
}

// Load data from file
$data = file_get_contents($filename);
if ($data === false) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Error reading data: " . error_get_last()['message'] . "\n", FILE_APPEND);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to read data',
        'data' => []
    ]);
} else {
    $students = json_decode($data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Error parsing JSON: " . json_last_error_msg() . "\n", FILE_APPEND);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid data format',
            'data' => []
        ]);
    } else {
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Data loaded successfully from " . $filename . "\n", FILE_APPEND);
        echo json_encode([
            'status' => 'success',
            'message' => 'Data loaded successfully',
            'data' => $students
        ]);
    }
} 